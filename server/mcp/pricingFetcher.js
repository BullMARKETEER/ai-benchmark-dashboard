"use strict";

/**
 * mcp/pricingFetcher.js
 *
 * MCP-style fetcher for model pricing data.
 * Extends BaseFetcher — inherits cache, scheduler, listeners, and logging.
 *
 * Features:
 *   - 1-hour cached pricing with auto-refresh scheduler
 *   - Simulated external API with ±5 % jitter + 10 % failure rate
 *   - Static fallback prices that never fail
 *   - Observable: call onUpdate(fn) to react to price changes
 *
 * Public API  (all inherited from BaseFetcher, plus convenience aliases):
 *   getPricing()          → Promise<PricingMap>        (alias for getData)
 *   getModelPrice(id)     → Promise<{input,output}|null>
 *   invalidateCache()     → void
 *   getCacheStatus()      → { cached, ageMs, expiresInMs, source, refreshCount }
 *   startScheduler(ms?)   → void   (auto-refresh; default = CACHE_TTL_MS)
 *   stopScheduler()       → void
 *   onUpdate(fn)          → unsubscribe function
 */

const BaseFetcher = require("./BaseFetcher");

// ── Static fallback prices ─────────────────────────────────────────────────
// USD per 1 000 tokens  (input / output)
const STATIC_PRICING = {
  "gpt-4o":            { input: 0.0025,  output: 0.01   },
  "gpt-4o-mini":       { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo":       { input: 0.01,    output: 0.03   },
  "gpt-3.5-turbo":     { input: 0.0005,  output: 0.0015 },
  "claude-3-opus":     { input: 0.015,   output: 0.075  },
  "claude-3.5-sonnet": { input: 0.003,   output: 0.015  },
  "gemini-1.5-pro":    { input: 0.00125, output: 0.005  },
  "llama-3-70b":       { input: 0.0008,  output: 0.0008 },
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── PricingFetcher class ───────────────────────────────────────────────────

class PricingFetcher extends BaseFetcher {
  constructor() {
    super("pricingFetcher", STATIC_PRICING, CACHE_TTL_MS);
  }

  /**
   * Simulate an HTTP call to an external pricing API.
   *
   * In production replace the body with a real HTTP GET, e.g.:
   *   const { fetchJSON } = require("./externalData");
   *   return fetchJSON("https://api.example.com/v1/model-pricing");
   *
   * Simulation:
   *  - Adds realistic network latency (80–220 ms)
   *  - Applies ±5 % price jitter to observe cache misses
   *  - Randomly throws 10 % of the time to exercise fallback path
   */
  async _fetchExternal() {
    const latency = 80 + Math.random() * 140;
    await new Promise((r) => setTimeout(r, latency));

    if (Math.random() < 0.10) {
      throw new Error("Simulated external pricing API timeout");
    }

    function jitter(base) {
      return +(base * (1 + (Math.random() * 0.1 - 0.05))).toFixed(7);
    }

    return {
      "gpt-4o":            { input: jitter(0.0025),  output: jitter(0.01)   },
      "gpt-4o-mini":       { input: jitter(0.00015), output: jitter(0.0006) },
      "gpt-4-turbo":       { input: jitter(0.01),    output: jitter(0.03)   },
      "gpt-3.5-turbo":     { input: jitter(0.0005),  output: jitter(0.0015) },
      "claude-3-opus":     { input: jitter(0.015),   output: jitter(0.075)  },
      "claude-3.5-sonnet": { input: jitter(0.003),   output: jitter(0.015)  },
      "gemini-1.5-pro":    { input: jitter(0.00125), output: jitter(0.005)  },
      "llama-3-70b":       { input: jitter(0.0008),  output: jitter(0.0008) },
    };
  }
}

// ── Singleton instance ─────────────────────────────────────────────────────
const instance = new PricingFetcher();

// ── Convenience wrappers (backwards-compatible) ────────────────────────────

/** @returns {Promise<PricingMap>} */
async function getPricing() {
  return instance.getData();
}

/** @returns {Promise<{input:number, output:number}|null>} */
async function getModelPrice(modelId) {
  const map = await instance.getData();
  return map[modelId] ?? null;
}

function invalidateCache() {
  instance.invalidateCache();
}

function getCacheStatus() {
  return instance.getCacheStatus();
}

module.exports = {
  // Original public API (unchanged for callers)
  getPricing,
  getModelPrice,
  invalidateCache,
  getCacheStatus,
  STATIC_PRICING,
  CACHE_TTL_MS,

  // New: direct access to the fetcher instance for scheduler / listeners
  pricingFetcher: instance,
};
