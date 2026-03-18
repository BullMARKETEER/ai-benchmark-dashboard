/**
 * POST /api/analyze-prompt   — Full pipeline (multi-model + optimize)
 * POST /api/compare-models   — Raw multi-model comparison (no optimization)
 * GET  /api/results          — list all past results (in-memory)
 * GET  /api/results/:id      — fetch a single result by id
 */

"use strict";

const { Router } = require("express");
const { analyzePrompt: promptPipeline } = require("../services/promptService");
const { runMultiModel } = require("../services/multiModelService");
const { analyzePrompt: legacyAnalyze, getResult, getAllResults } = require("../services/analyzeService");

const router = Router();

// ── POST /api/analyze-prompt ────────────────────────────────────────────────
router.post("/analyze-prompt", async (req, res, next) => {
  try {
    const { prompt, models } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Request body must contain a non-empty 'prompt' string.",
      });
    }

    const result = await promptPipeline(prompt.trim(), models);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/compare-models ────────────────────────────────────────────────
router.post("/compare-models", async (req, res, next) => {
  try {
    const { prompt, models } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Request body must contain a non-empty 'prompt' string.",
      });
    }

    const result = await runMultiModel(prompt.trim(), models);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/results ────────────────────────────────────────────────────────
router.get("/results", (_req, res) => {
  res.json(getAllResults());
});

// ── GET /api/results/:id ────────────────────────────────────────────────────
router.get("/results/:id", (req, res) => {
  const result = getResult(req.params.id);
  if (!result) return res.status(404).json({ error: "Result not found." });
  res.json(result);
});

module.exports = router;
