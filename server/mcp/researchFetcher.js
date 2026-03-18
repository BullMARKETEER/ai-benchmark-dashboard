"use strict";

/**
 * mcp/researchFetcher.js
 *
 * MCP-style fetcher for AI research papers / model release notes.
 * Extends BaseFetcher — inherits cache, scheduler, listeners, and logging.
 *
 * Simulates pulling summaries of recent AI research papers that
 * are relevant to the models in the dashboard.  In production,
 * replace `_fetchExternal()` with a real API call (e.g. Semantic Scholar,
 * arXiv, or an internal knowledge-base endpoint).
 *
 * Public API  (inherited from BaseFetcher):
 *   getData()            → Promise<ResearchData>
 *   invalidateCache()    → void
 *   getCacheStatus()     → { cached, ageMs, expiresInMs, source, refreshCount }
 *   startScheduler(ms?)  → void
 *   stopScheduler()      → void
 *   onUpdate(fn)         → unsubscribe function
 */

const BaseFetcher = require("./BaseFetcher");

// ── Static fallback data ───────────────────────────────────────────────────

const STATIC_RESEARCH = {
  updatedAt: "2026-03-01T00:00:00Z",
  papers: [
    {
      id: "gpt4o-system-card",
      title: "GPT-4o System Card",
      model: "gpt-4o",
      url: "https://openai.com/research/gpt-4o-system-card",
      summary: "Details the architecture, safety evaluations, and capability benchmarks for GPT-4o.",
      date: "2025-05-13",
    },
    {
      id: "claude3-model-card",
      title: "The Claude 3 Model Family",
      model: "claude-3-opus",
      url: "https://www.anthropic.com/research/claude-3",
      summary: "Introduces Claude 3 Opus, Sonnet, and Haiku with multimodal capabilities and benchmark results.",
      date: "2025-03-04",
    },
    {
      id: "gemini-tech-report",
      title: "Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context",
      model: "gemini-1.5-pro",
      url: "https://arxiv.org/abs/2403.05530",
      summary: "Describes the long-context architecture enabling Gemini 1.5 Pro to process up to 10M tokens.",
      date: "2025-02-15",
    },
    {
      id: "llama3-intro",
      title: "Llama 3: Open Foundation Models",
      model: "llama-3-70b",
      url: "https://ai.meta.com/research/publications/llama-3",
      summary: "Presents Llama 3 70B with competitive performance on standard benchmarks using open weights.",
      date: "2025-04-18",
    },
  ],
};

// ── Cache TTL ──────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours (research changes less often)

// ── ResearchFetcher class ──────────────────────────────────────────────────

class ResearchFetcher extends BaseFetcher {
  constructor() {
    super("researchFetcher", STATIC_RESEARCH, CACHE_TTL_MS);
  }

  /**
   * Simulate fetching latest research papers from an external API.
   *
   * In production replace with:
   *   const { fetchJSON } = require("./externalData");
   *   return fetchJSON("https://api.example.com/v1/ai-research?limit=10");
   */
  async _fetchExternal() {
    const latency = 100 + Math.random() * 200;
    await new Promise((r) => setTimeout(r, latency));

    // 15 % simulated failure rate
    if (Math.random() < 0.15) {
      throw new Error("Simulated research API unavailable");
    }

    // Return static data with an updated timestamp to simulate freshness
    return {
      ...STATIC_RESEARCH,
      updatedAt: new Date().toISOString(),
    };
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────
const instance = new ResearchFetcher();

module.exports = {
  researchFetcher: instance,
  STATIC_RESEARCH,
  CACHE_TTL_MS,
};
