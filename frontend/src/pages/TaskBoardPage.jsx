import { useMemo, useState } from "react";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";

const columns = [
  { key: "new", label: "New" },
  { key: "assigned", label: "Assigned" },
  { key: "in-progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

const BOARD_BANNER = "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1400&q=80";

export default function TaskBoardPage({ complaints, onDropStatus, onAssign, onBulkStatus, onAddComment }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [assigneeName, setAssigneeName] = useState("Field Officer");
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [commentText, setCommentText] = useState("");

  const grouped = useMemo(
    () =>
      columns.reduce((acc, column) => {
        acc[column.key] = complaints.filter((c) => c.status === column.key);
        return acc;
      }, {}),
    [complaints]
  );

  const onDragStart = (event, id) => {
    event.dataTransfer.setData("complaintId", id);
  };

  const onDrop = async (event, status) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("complaintId");
    if (id) await onDropStatus(id, status);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submitComment = async () => {
    if (!activeComplaint || !commentText.trim()) return;
    await onAddComment(activeComplaint._id, commentText.trim());
    setCommentText("");
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-white/70">
        <img src={BOARD_BANNER} alt="Kumbh operations" className="h-28 w-full object-cover" />
        <div className="kumbh-hero-overlay absolute inset-0" />
        <div className="absolute inset-0 flex items-center px-4 text-white">
          <h2 className="text-lg font-bold">Interactive Task Board - Drag, Assign, Resolve</h2>
        </div>
      </div>

      <div className="kumbh-glass rounded-xl border border-white/70 p-3 flex flex-wrap gap-3 items-center">
        <p className="text-sm font-semibold">Bulk Actions ({selectedIds.length} selected)</p>
        <button
          onClick={() => onBulkStatus(selectedIds, "resolved")}
          className="rounded bg-emerald-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          disabled={!selectedIds.length}
        >
          Mark Resolved
        </button>
        <button
          onClick={() => onBulkStatus(selectedIds, "in-progress")}
          className="rounded bg-purple-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          disabled={!selectedIds.length}
        >
          Mark In Progress
        </button>
        <input
          value={assigneeName}
          onChange={(e) => setAssigneeName(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
          placeholder="Assignee name"
        />
        <button
          onClick={() => selectedIds.forEach((id) => onAssign(id, `assignee-${id}`, assigneeName))}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          disabled={!selectedIds.length}
        >
          Assign Selected
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div
            key={column.key}
            className="kumbh-glass rounded-xl p-3 border border-white/70 min-h-[65vh]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, column.key)}
          >
            <h2 className="font-semibold mb-3">{column.label}</h2>

            <div className="space-y-3">
              {grouped[column.key].map((complaint) => (
                <div
                  key={complaint._id}
                  draggable
                  onDragStart={(event) => onDragStart(event, complaint._id)}
                  className="card-lift bg-white rounded-md p-3 border border-slate-100 shadow-sm cursor-grab"
                >
                  <div className="flex items-start gap-2">
                    <input type="checkbox" checked={selectedIds.includes(complaint._id)} onChange={() => toggleSelect(complaint._id)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">{complaint.text}</p>
                      <p className="text-xs text-slate-500 mb-1">{complaint.locationName}</p>
                      <p className="text-xs text-slate-500 mb-2">Assignee: {complaint.assigneeName || "Unassigned"}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{complaint.category}</span>
                        <PriorityBadge priority={complaint.priority} />
                        <StatusBadge status={complaint.status} />
                      </div>
                      <button onClick={() => setActiveComplaint(complaint)} className="mt-2 text-xs text-orange-700 underline">
                        Open Interactive Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setActiveComplaint(null)}>
          <div className="h-full w-full max-w-md bg-white p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Complaint Details</h3>
            <p className="text-sm mb-2">{activeComplaint.text}</p>
            <p className="text-xs text-slate-600 mb-3">SLA: {activeComplaint.slaDueAt ? new Date(activeComplaint.slaDueAt).toLocaleString() : "N/A"}</p>

            <h4 className="font-semibold text-sm mb-2">Activity Timeline</h4>
            <div className="space-y-2 mb-4">
              {(activeComplaint.activityLog || []).slice().reverse().map((event, idx) => (
                <div key={idx} className="rounded border p-2 text-xs">
                  <p className="font-semibold">{event.action}</p>
                  <p>{event.actorName || "System"}</p>
                  <p>{event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}</p>
                </div>
              ))}
            </div>

            <h4 className="font-semibold text-sm mb-2">Comments</h4>
            <div className="space-y-2 mb-3">
              {(activeComplaint.comments || []).map((comment, idx) => (
                <div key={idx} className="rounded border p-2 text-xs">
                  <p className="font-semibold">{comment.authorName}</p>
                  <p>{comment.text}</p>
                </div>
              ))}
            </div>
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="w-full rounded border p-2 text-sm" rows={3} placeholder="Add comment" />
            <button onClick={submitComment} className="mt-2 rounded bg-slate-900 px-3 py-1 text-sm text-white">Add Comment</button>
          </div>
        </div>
      )}
    </div>
  );
}
