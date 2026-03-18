"use strict";

/**
 * mcp/benchmarkFetcher.js
 *
 * MCP-style fetcher for model benchmark scores (MMLU, HumanEval, ARC, etc.).
 * Extends BaseFetcher — inherits cache, scheduler, listeners, and logging.
 *
 * Simulates pulling the latest benchmark leaderboard data.
 * In production, replace `_fetchExternal()` with a real API call
 * (e.g. Hugging Face Open LLM Leaderboard, LMSYS Chatbot Arena, etc.).
 *
 * Public API  (inherited from BaseFetcher):
 *   getData()            → Promise<BenchmarkData>
 *   invalidateCache()    → void
 *   getCacheStatus()     → { cached, ageMs, expiresInMs, source, refreshCount }
 *   startScheduler(ms?)  → void
 *   stopScheduler()      → void
 *   onUpdate(fn)         → unsubscribe function
 */

const BaseFetcher = require("./BaseFetcher");

// ── Static fallback data ───────────────────────────────────────────────────

const STATIC_BENCHMARKS = {
  updatedAt: "2026-03-01T00:00:00Z",
  source: "static-cache",
  benchmarks: {
    "gpt-4o":            { mmlu: 88.7, humanEval: 90.2, arc: 96.4, chatbotArena: 1287 },
    "gpt-4o-mini":       { mmlu: 82.0, humanEval: 87.0, arc: 93.1, chatbotArena: 1200 },
    "gpt-4-turbo":       { mmlu: 86.4, humanEval: 87.1, arc: 96.3, chatbotArena: 1260 },
    "gpt-3.5-turbo":     { mmlu: 70.0, humanEval: 48.1, arc: 85.2, chatbotArena: 1105 },
    "claude-3-opus":     { mmlu: 86.8, humanEval: 84.9, arc: 96.4, chatbotArena: 1253 },
    "claude-3.5-sonnet": { mmlu: 88.7, humanEval: 92.0, arc: 96.7, chatbotArena: 1271 },
    "gemini-1.5-pro":    { mmlu: 85.9, humanEval: 71.9, arc: 93.0, chatbotArena: 1232 },
    "llama-3-70b":       { mmlu: 82.0, humanEval: 81.7, arc: 93.0, chatbotArena: 1208 },
  },
};

// ── Cache TTL ──────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours (benchmarks change rarely)

// ── BenchmarkFetcher class ─────────────────────────────────────────────────

class BenchmarkFetcher extends BaseFetcher {
  constructor() {
    super("benchmarkFetcher", STATIC_BENCHMARKS, CACHE_TTL_MS);
  }

  /**
   * Simulate fetching latest benchmark scores from an external leaderboard.
   *
   * In production replace with:
   *   const { fetchJSON } = require("./externalData");
   *   return fetchJSON("https://api.example.com/v1/benchmarks");
   */
  async _fetchExternal() {
    const latency = 120 + Math.random() * 180;
    await new Promise((r) => setTimeout(r, latency));

    // 10 % simulated failure rate
    if (Math.random() < 0.10) {
      throw new Error("Simulated benchmark leaderboard API timeout");
    }

    // Small jitter on scores to simulate leaderboard updates
    function jitter(base, range = 0.5) {
      return +(base + (Math.random() * range * 2 - range)).toFixed(1);
    }

    const benchmarks = {};
    for (const [model, scores] of Object.entries(STATIC_BENCHMARKS.benchmarks)) {
      benchmarks[model] = {
        mmlu:         jitter(scores.mmlu),
        humanEval:    jitter(scores.humanEval),
        arc:          jitter(scores.arc),
        chatbotArena: Math.round(scores.chatbotArena + (Math.random() * 10 - 5)),
      };
    }

    return {
      updatedAt: new Date().toISOString(),
      source: "external",
      benchmarks,
    };
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────
const instance = new BenchmarkFetcher();

module.exports = {
  benchmarkFetcher: instance,
  STATIC_BENCHMARKS,
  CACHE_TTL_MS,
};
