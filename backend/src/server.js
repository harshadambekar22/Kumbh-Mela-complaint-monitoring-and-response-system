require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const complaintsModule = require("./routes/complaints");
const authRouter = require("./routes/auth");
const auditRouter = require("./routes/audit");
const { authenticate } = require("./middleware/auth");
const { fetchAllProviders, updateRunState } = require("./services/socialIngestion");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kumbh-complaints";
const ALLOWED_ORIGINS = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server tools and health checks without Origin header.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for origin"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  console.log(JSON.stringify({ level: "info", requestId: req.requestId, method: req.method, path: req.path }));
  next();
});
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: mongoose.connection.readyState === 1 ? "mongo" : "memory" });
});

app.use("/api/auth", authRouter);
app.use("/api/complaints", authenticate, complaintsModule.router);
app.use("/api/audit", authenticate, auditRouter);

let socialTimer = null;

async function runSocialSyncCycle() {
  try {
    const fetched = await fetchAllProviders();
    const queued = complaintsModule.enqueuePosts(fetched);
    const actor = { id: "system-social", name: "Social Ingestion Bot", role: "system" };
    const result = await complaintsModule.processIngestionQueue(actor);
    updateRunState({ queued, processed: result.created });
    console.log(JSON.stringify({ level: "info", source: "social_sync", fetched: fetched.length, created: result.created }));
  } catch (error) {
    console.warn("Social sync cycle failed:", error.message);
  }
}

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected");
  } catch (error) {
    console.warn("MongoDB unavailable, running in in-memory mode:", error.message);
  } finally {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
    if (String(process.env.SOCIAL_SYNC_ENABLED || "true") === "true") {
      const intervalMs = Number(process.env.SOCIAL_SYNC_INTERVAL_MS || 60000);
      socialTimer = setInterval(runSocialSyncCycle, intervalMs);
      runSocialSyncCycle();
      console.log(`Social sync scheduler enabled (${intervalMs}ms)`);
    }
  }
}

startServer();
