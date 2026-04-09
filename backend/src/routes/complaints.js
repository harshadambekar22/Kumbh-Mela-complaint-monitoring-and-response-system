const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const { analyzeText, resolveCoordinates } = require("../services/aiService");
const { requireRoles } = require("../middleware/auth");
const { logAudit } = require("../services/auditStore");
const { fetchAllProviders, updateRunState, getSocialState } = require("../services/socialIngestion");

const router = express.Router();
let ingestQueue = [];
let memoryComplaints = [];
let savedViews = [];

function enqueuePosts(posts = []) {
  const valid = posts.filter((p) => p?.text && p?.platform && p?.username);
  ingestQueue = [...ingestQueue, ...valid];
  return ingestQueue.length;
}

function getQueueCount() {
  return ingestQueue.length;
}

function usingMongo() {
  return mongoose.connection.readyState === 1;
}

function addActivity(item, action, actor, meta = {}) {
  const event = {
    action,
    actorId: actor?.id || "system",
    actorName: actor?.name || "System",
    meta,
    createdAt: new Date(),
  };
  item.activityLog = [...(item.activityLog || []), event];
}

function toMemoryComplaint(input, actor) {
  const now = new Date();
  const item = {
    _id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    comments: [],
    activityLog: [],
    escalationLevel: 0,
    ...input,
  };
  addActivity(item, "created", actor, { status: item.status });
  return item;
}

function normalize(str = "") {
  return String(str).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function dedupeKey(post) {
  return `${normalize(post.text).slice(0, 90)}|${normalize(post.platform)}|${normalize(post.username)}`;
}

function isSpam(text) {
  const lowered = String(text || "").toLowerCase();
  return lowered.includes("buy now") || lowered.includes("promo") || lowered.includes("http://") || lowered.includes("https://");
}

function applyFilters(list, query) {
  const {
    q,
    category,
    status,
    priority,
    platform,
    department,
    assigneeId,
    reviewState,
    page = 1,
    limit = 100,
  } = query;

  let filtered = [...list];
  if (q) {
    const term = q.toLowerCase();
    filtered = filtered.filter((c) => [c.text, c.locationName, c.username].some((v) => String(v || "").toLowerCase().includes(term)));
  }
  for (const [key, val] of Object.entries({ category, status, priority, platform, department, assigneeId, reviewState })) {
    if (val) filtered = filtered.filter((c) => String(c[key] || "") === String(val));
  }

  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const start = (p - 1) * l;
  return { total: filtered.length, page: p, limit: l, items: filtered.slice(start, start + l) };
}

async function processIngestionQueue(actor) {
  if (!ingestQueue.length) {
    return { created: 0, complaints: [] };
  }

  const created = [];
  const existing = usingMongo() ? await Complaint.find({}, { dedupeKey: 1 }).lean() : memoryComplaints;
  const dedupeSet = new Set(existing.map((x) => x.dedupeKey).filter(Boolean));

  for (const post of ingestQueue) {
      if (isSpam(post.text)) continue;
      const key = dedupeKey(post);
      if (dedupeSet.has(key)) continue;

      const analysis = await analyzeText(post.text);
      if (!analysis.isComplaint) continue;

      const coords = resolveCoordinates(analysis.locationName, analysis.category);
      const confidence = typeof analysis.confidence === "number" ? analysis.confidence : 0.75;
      const reviewState = confidence < 0.6 ? "needs_review" : "auto_approved";

      const complaintPayload = {
        text: post.text,
        platform: post.platform,
        username: post.username,
        category: analysis.category,
        department: analysis.department,
        priority: analysis.priority,
        locationName: analysis.locationName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: "new",
        slaDueAt: new Date(Date.now() + (analysis.priority === "high" ? 2 : analysis.priority === "medium" ? 6 : 12) * 60 * 60 * 1000),
        escalationLevel: 0,
        confidence,
        reviewState,
        dedupeKey: key,
        comments: [],
        activityLog: [],
      };

    let complaint;
    if (usingMongo()) {
      complaint = await Complaint.create(complaintPayload);
      complaint.activityLog = [
        {
          action: "created",
          actorId: actor.id,
          actorName: actor.name,
          meta: { source: "ingest_process", reviewState },
          createdAt: new Date(),
        },
      ];
      await complaint.save();
    } else {
      complaint = toMemoryComplaint(complaintPayload, actor);
      complaint.activityLog[0].meta = { source: "ingest_process", reviewState };
      memoryComplaints.push(complaint);
    }

      dedupeSet.add(key);
      created.push(complaint);
    }

  await logAudit({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: "process_ingestion_queue",
    targetType: "complaint",
    meta: { created: created.length },
  });
  ingestQueue = [];
  return { created: created.length, complaints: created };
}

router.post("/process", requireRoles("admin", "operator"), async (req, res) => {
  try {
    if (!ingestQueue.length) {
      return res.status(400).json({ message: "No queued posts. Call /ingest first." });
    }
    const result = await processIngestionQueue(req.user);
    res.json({ message: "Complaints processed", ...result });
  } catch (error) {
    res.status(500).json({ message: "Failed to process complaints", error: error.message });
  }
});

router.post("/ingest", requireRoles("admin", "operator"), async (req, res) => {
  try {
    const posts = Array.isArray(req.body.posts) ? req.body.posts : [];
    const queued = enqueuePosts(posts);
    res.json({ message: "Posts queued for processing", queued });
  } catch (error) {
    res.status(500).json({ message: "Failed to ingest posts", error: error.message });
  }
});

router.post("/social/sync-now", requireRoles("admin", "operator"), async (req, res) => {
  try {
    const fetched = await fetchAllProviders();
    const queued = enqueuePosts(fetched);
    const result = await processIngestionQueue(req.user);
    updateRunState({ queued, processed: result.created });
    res.json({ fetched: fetched.length, queued, created: result.created });
  } catch (error) {
    res.status(500).json({ message: "Social sync failed", error: error.message });
  }
});

router.get("/social/status", requireRoles("admin", "operator"), async (_req, res) => {
  res.json({ queue: getQueueCount(), state: getSocialState() });
});

router.get("/", async (req, res) => {
  try {
    const complaints = usingMongo()
      ? await Complaint.find().sort({ createdAt: -1 }).lean()
      : [...memoryComplaints].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const data = applyFilters(complaints, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
});

router.get("/analytics/summary", async (_req, res) => {
  const complaints = usingMongo() ? await Complaint.find().lean() : memoryComplaints;
  const by = (field) => complaints.reduce((acc, c) => ((acc[c[field]] = (acc[c[field]] || 0) + 1), acc), {});
  const departmentPerformance = Object.entries(
    complaints.reduce((acc, c) => {
      const dep = c.department || "Unknown";
      if (!acc[dep]) acc[dep] = { total: 0, resolved: 0 };
      acc[dep].total += 1;
      if (c.status === "resolved") acc[dep].resolved += 1;
      return acc;
    }, {})
  ).map(([department, stats]) => ({
    department,
    ...stats,
    resolutionRate: stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0,
  }));

  res.json({
    total: complaints.length,
    highPriority: complaints.filter((c) => c.priority === "high").length,
    unresolved: complaints.filter((c) => c.status !== "resolved").length,
    byCategory: by("category"),
    byStatus: by("status"),
    byDepartment: by("department"),
    departmentPerformance,
  });
});

router.get("/alerts", async (_req, res) => {
  const complaints = usingMongo() ? await Complaint.find().lean() : memoryComplaints;
  const now = Date.now();
  const highNew = complaints.filter((c) => c.priority === "high" && c.status !== "resolved");
  const breached = complaints.filter((c) => c.slaDueAt && new Date(c.slaDueAt).getTime() < now && c.status !== "resolved");
  res.json({
    alerts: [
      ...(highNew.length ? [{ type: "high_priority", count: highNew.length, severity: "high" }] : []),
      ...(breached.length ? [{ type: "sla_breached", count: breached.length, severity: "critical" }] : []),
    ],
  });
});

router.post("/saved-views", async (req, res) => {
  const payload = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    name: req.body.name || "Untitled View",
    filters: req.body.filters || {},
    createdAt: new Date(),
  };
  savedViews.push(payload);
  res.status(201).json(payload);
});

router.get("/saved-views", async (req, res) => {
  res.json(savedViews.filter((v) => v.userId === req.user.id));
});

router.patch("/:id/status", requireRoles("admin", "operator", "department_officer"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["new", "assigned", "in-progress", "resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    let complaint;
    if (usingMongo()) {
      complaint = await Complaint.findById(req.params.id);
      if (!complaint) return res.status(404).json({ message: "Complaint not found" });
      complaint.status = status;
      complaint.updatedAt = new Date();
      complaint.activityLog.push({
        action: "status_updated",
        actorId: req.user.id,
        actorName: req.user.name,
        meta: { status },
        createdAt: new Date(),
      });
      await complaint.save();
    } else {
      const idx = memoryComplaints.findIndex((c) => c._id === req.params.id);
      if (idx === -1) return res.status(404).json({ message: "Complaint not found" });
      memoryComplaints[idx] = { ...memoryComplaints[idx], status, updatedAt: new Date() };
      addActivity(memoryComplaints[idx], "status_updated", req.user, { status });
      complaint = memoryComplaints[idx];
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

router.patch("/:id/assign", requireRoles("admin", "operator"), async (req, res) => {
  const { assigneeId, assigneeName } = req.body;
  if (!assigneeId || !assigneeName) return res.status(400).json({ message: "assigneeId and assigneeName are required" });

  if (usingMongo()) {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    complaint.assigneeId = assigneeId;
    complaint.assigneeName = assigneeName;
    if (complaint.status === "new") complaint.status = "assigned";
    complaint.activityLog.push({ action: "assigned", actorId: req.user.id, actorName: req.user.name, meta: { assigneeId, assigneeName }, createdAt: new Date() });
    await complaint.save();
    await logAudit({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: "assign_complaint",
      targetType: "complaint",
      targetId: String(complaint._id),
      meta: { assigneeId, assigneeName },
    });
    return res.json(complaint);
  }

  const idx = memoryComplaints.findIndex((c) => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Complaint not found" });
  memoryComplaints[idx].assigneeId = assigneeId;
  memoryComplaints[idx].assigneeName = assigneeName;
  if (memoryComplaints[idx].status === "new") memoryComplaints[idx].status = "assigned";
  addActivity(memoryComplaints[idx], "assigned", req.user, { assigneeId, assigneeName });
  await logAudit({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: "assign_complaint",
    targetType: "complaint",
    targetId: String(memoryComplaints[idx]._id),
    meta: { assigneeId, assigneeName },
  });
  return res.json(memoryComplaints[idx]);
});

router.post("/:id/comments", requireRoles("admin", "operator", "department_officer"), async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ message: "Comment text is required" });

  const comment = { authorId: req.user.id, authorName: req.user.name, text, createdAt: new Date() };
  if (usingMongo()) {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    complaint.comments.push(comment);
    complaint.activityLog.push({ action: "comment_added", actorId: req.user.id, actorName: req.user.name, meta: { text }, createdAt: new Date() });
    await complaint.save();
    return res.json(complaint);
  }

  const idx = memoryComplaints.findIndex((c) => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Complaint not found" });
  memoryComplaints[idx].comments = [...(memoryComplaints[idx].comments || []), comment];
  addActivity(memoryComplaints[idx], "comment_added", req.user, { text });
  return res.json(memoryComplaints[idx]);
});

router.patch("/bulk", requireRoles("admin", "operator"), async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const patch = req.body.patch || {};
  if (!ids.length) return res.status(400).json({ message: "ids is required" });

  if (usingMongo()) {
    await Complaint.updateMany({ _id: { $in: ids } }, { $set: patch });
    const updated = await Complaint.find({ _id: { $in: ids } });
    return res.json({ updated: updated.length, complaints: updated });
  }

  let updated = 0;
  memoryComplaints = memoryComplaints.map((c) => {
    if (!ids.includes(c._id)) return c;
    updated += 1;
    const next = { ...c, ...patch, updatedAt: new Date() };
    addActivity(next, "bulk_updated", req.user, patch);
    return next;
  });
  return res.json({ updated, complaints: memoryComplaints.filter((c) => ids.includes(c._id)) });
});

router.post("/:id/review", requireRoles("admin", "operator", "department_officer"), async (req, res) => {
  const { category, priority, reviewState = "reviewed" } = req.body;

  if (usingMongo()) {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    if (category) complaint.category = category;
    if (priority) complaint.priority = priority;
    complaint.reviewState = reviewState;
    complaint.activityLog.push({ action: "human_reviewed", actorId: req.user.id, actorName: req.user.name, meta: { category, priority, reviewState }, createdAt: new Date() });
    await complaint.save();
    return res.json(complaint);
  }

  const idx = memoryComplaints.findIndex((c) => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Complaint not found" });
  if (category) memoryComplaints[idx].category = category;
  if (priority) memoryComplaints[idx].priority = priority;
  memoryComplaints[idx].reviewState = reviewState;
  addActivity(memoryComplaints[idx], "human_reviewed", req.user, { category, priority, reviewState });
  return res.json(memoryComplaints[idx]);
});

module.exports = {
  router,
  enqueuePosts,
  processIngestionQueue,
  getQueueCount,
};
