const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");

let memoryAuditLogs = [];

function usingMongo() {
  return mongoose.connection.readyState === 1;
}

async function logAudit(entry) {
  const payload = { ...entry, createdAt: new Date() };
  if (usingMongo()) {
    await AuditLog.create(payload);
  } else {
    memoryAuditLogs.push(payload);
  }
}

async function listAudit(limit = 200) {
  if (usingMongo()) {
    return AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  }
  return [...memoryAuditLogs].reverse().slice(0, limit);
}

module.exports = {
  logAudit,
  listAudit,
};
