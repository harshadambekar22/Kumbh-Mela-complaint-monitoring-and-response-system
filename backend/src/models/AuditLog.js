const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: String,
    actorName: String,
    actorRole: String,
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: null },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
