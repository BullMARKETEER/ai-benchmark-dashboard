require("dotenv").config();
const express = require("express");
const cors = require("cors");
const analyzeRoutes = require("./controllers/analyzeController");
const modelsRoutes = require("./controllers/modelsController");
const { startAll, getStatus } = require("./mcp/mcpScheduler");

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

// ── Health check ───────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mcp: getStatus(),
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use("/api", analyzeRoutes);
app.use("/api", modelsRoutes);

// ── MCP status endpoint ────────────────────────────────────
app.get("/api/mcp/status", (_req, res) => {
  res.json(getStatus());
});

// ── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 AI Benchmark API running on http://localhost:${PORT}`);
  startAll();   // boot all MCP fetcher schedulers
});
