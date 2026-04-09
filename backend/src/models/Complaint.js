const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    platform: {
      type: String,
      enum: ["twitter", "instagram", "facebook"],
      required: true,
    },
    username: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "traffic",
        "water",
        "electricity",
        "medical",
        "lost_and_found",
        "sanitation",
      ],
      required: true,
    },
    department: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
    locationName: { type: String, default: "Unknown" },
    latitude: { type: Number, default: 19.9975 },
    longitude: { type: Number, default: 73.7898 },
    status: {
      type: String,
      enum: ["new", "assigned", "in-progress", "resolved"],
      default: "new",
    },
    assigneeId: { type: String, default: null },
    assigneeName: { type: String, default: null },
    slaDueAt: { type: Date, default: null },
    escalationLevel: { type: Number, default: 0 },
    reviewState: { type: String, enum: ["auto_approved", "needs_review", "reviewed"], default: "auto_approved" },
    confidence: { type: Number, default: 0.75 },
    dedupeKey: { type: String, default: null },
    comments: [
      {
        _id: false,
        authorId: String,
        authorName: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activityLog: [
      {
        _id: false,
        action: String,
        actorId: String,
        actorName: String,
        meta: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model("Complaint", complaintSchema);
