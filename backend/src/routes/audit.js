const express = require("express");
const { requireRoles } = require("../middleware/auth");
const { listAudit } = require("../services/auditStore");

const router = express.Router();

router.get("/", requireRoles("admin"), async (req, res) => {
  const limit = Number(req.query.limit || 200);
  const logs = await listAudit(limit);
  res.json(logs);
});

module.exports = router;
