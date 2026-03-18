/**
 * GET /api/models          — List all available models with metadata + static prices
 * GET /api/pricing         — Live/cached pricing map  { modelId: { input, output } }
 * GET /api/pricing/cache   — Cache status (age, TTL, source)
 * GET /api/benchmarks      — External benchmark scores
 */

const { Router } = require("express");
const { getAllModels } = require("../utils/pricingEngine");
const { getPricing, getCacheStatus, invalidateCache, CACHE_TTL_MS } = require("../mcp/pricingFetcher");
const { fetchBenchmarkScores } = require("../mcp/externalData");

const router = Router();

// ── GET /api/models ────────────────────────────────────────────────────────
router.get("/models", (_req, res) => {
  const models = getAllModels();
  res.json({ models, count: models.length });
});

// ── GET /api/pricing ───────────────────────────────────────────────────────
router.get("/pricing", async (_req, res, next) => {
  try {
    const pricing   = await getPricing();
    const { source, ageMs, expiresInMs } = getCacheStatus();
    res.json({
      pricing,
      meta: {
        source,
        cachedAgeMs:    ageMs,
        expiresInMs,
        cacheTtlMs:     CACHE_TTL_MS,
        fetchedAt:      ageMs != null ? new Date(Date.now() - ageMs).toISOString() : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/pricing/cache ─────────────────────────────────────────────────
router.get("/pricing/cache", (_req, res) => {
  res.json(getCacheStatus());
});

// ── DELETE /api/pricing/cache  (force refresh) ─────────────────────────────
router.delete("/pricing/cache", (_req, res) => {
  invalidateCache();
  res.json({ message: "Pricing cache invalidated. Next request will re-fetch." });
});

// ── GET /api/benchmarks ───────────────────────────────────────────────────
router.get("/benchmarks", async (_req, res, next) => {
  try {
    const data = await fetchBenchmarkScores();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

