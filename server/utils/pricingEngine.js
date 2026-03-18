/**
 * pricingEngine.js
 *
 * Computes token costs using prices sourced from pricingFetcher (live/cached)
 * with an instant synchronous fallback to static prices.
 *
 * Two entry points:
 *   estimateCost(modelId, in, out)      — sync,  uses STATIC_PRICING
 *   estimateCostLive(modelId, in, out)  — async, uses live/cached prices
 *
 * Prices are in USD per 1 000 tokens.
 */

"use strict";

const { getPricing, STATIC_PRICING } = require("../mcp/pricingFetcher");

// Rich metadata kept separate from raw prices so pricingFetcher stays pure.
const MODEL_META = {
  "gpt-4o":            { displayName: "GPT-4o",            provider: "openai"    },
  "gpt-4o-mini":       { displayName: "GPT-4o Mini",       provider: "openai"    },
  "gpt-4-turbo":       { displayName: "GPT-4 Turbo",       provider: "openai"    },
  "gpt-3.5-turbo":     { displayName: "GPT-3.5 Turbo",     provider: "openai"    },
  "claude-3-opus":     { displayName: "Claude 3 Opus",     provider: "anthropic" },
  "claude-3.5-sonnet": { displayName: "Claude 3.5 Sonnet", provider: "anthropic" },
  "gemini-1.5-pro":    { displayName: "Gemini 1.5 Pro",    provider: "google"    },
  "llama-3-70b":       { displayName: "Llama 3 70B",       provider: "meta"      },
};

// Legacy shape kept for backward-compat with any code that reads MODEL_PRICING directly.
const MODEL_PRICING = Object.fromEntries(
  Object.entries(STATIC_PRICING).map(([id, p]) => [
    id,
    {
      ...(MODEL_META[id] || { displayName: id, provider: "unknown" }),
      inputPer1k:  p.input,
      outputPer1k: p.output,
    },
  ])
);

// ── Shared cost calculator ─────────────────────────────────────────────────
function _calcCost(modelId, inputPer1k, outputPer1k, inputTokens, outputTokens) {
  const inputCost  = (inputTokens  / 1000) * inputPer1k;
  const outputCost = (outputTokens / 1000) * outputPer1k;
  return {
    inputCost:  +inputCost.toFixed(6),
    outputCost: +outputCost.toFixed(6),
    totalCost:  +(inputCost + outputCost).toFixed(6),
    currency:   "USD",
  };
}

/**
 * Synchronous cost estimate using bundled static prices.
 * Zero latency — safe to call anywhere.
 *
 * @param {string} modelId
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {{ inputCost, outputCost, totalCost, currency }}
 */
function estimateCost(modelId, inputTokens, outputTokens) {
  const p = STATIC_PRICING[modelId];
  if (!p) return { inputCost: 0, outputCost: 0, totalCost: 0, currency: "USD", note: "Unknown model" };
  return _calcCost(modelId, p.input, p.output, inputTokens, outputTokens);
}

/**
 * Async cost estimate using live/cached prices from pricingFetcher.
 * Falls back to static prices automatically if the fetcher fails.
 *
 * @param {string} modelId
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {Promise<{ inputCost, outputCost, totalCost, currency, priceSource }>}
 */
async function estimateCostLive(modelId, inputTokens, outputTokens) {
  const pricing    = await getPricing();
  const p          = pricing[modelId] || STATIC_PRICING[modelId];
  const priceSource = pricing[modelId] ? "live" : "static-fallback";

  if (!p) return { inputCost: 0, outputCost: 0, totalCost: 0, currency: "USD", note: "Unknown model", priceSource };

  return { ..._calcCost(modelId, p.input, p.output, inputTokens, outputTokens), priceSource };
}

/**
 * List all known models with metadata + current static prices.
 */
function getAllModels() {
  return Object.entries(MODEL_PRICING).map(([id, meta]) => ({ id, ...meta }));
}

function getModelPricing(modelId) {
  return MODEL_PRICING[modelId] || null;
}

module.exports = { estimateCost, estimateCostLive, getAllModels, getModelPricing, MODEL_PRICING };
