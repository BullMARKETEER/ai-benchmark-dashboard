"use strict";

/**
 * services/multiModelService.js
 *
 * Runs the same prompt across multiple models in parallel using Promise.all.
 *
 * Per-model measurement:
 *   - latency       (ms, via Date.now delta)
 *   - inputTokens   (shared, counted once)
 *   - outputTokens  (per model, counted from output text)
 *   - output        (full model response)
 *   - cost          (USD, via pricingEngine live/cached)
 *   - energy        (Wh, via energyService with confidence)
 *   - qualityScore  (1–10, via evaluatorService)
 *
 * Returns a structured comparison:
 *   {
 *     prompt,
 *     inputTokens,
 *     results:    [ ...per-model results ],
 *     comparison: { fastest, cheapest, highestQuality, mostEfficient, rankings }
 *   }
 *
 * Public API:
 *   runMultiModel(prompt, modelIds?)  → Promise<MultiModelResult>
 */

const { countTokens }      = require("../utils/tokenCounter");
const { estimateCostLive } = require("../utils/pricingEngine");
const { estimateEnergy }   = require("./energyService");
const { evaluate }         = require("./evaluatorService");
const modelRunner          = require("./modelRunner");

// ── Default model list ─────────────────────────────────────────────────────
const DEFAULT_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "claude-3-opus",
  "claude-3.5-sonnet",
  "gemini-1.5-pro",
  "llama-3-70b",
];

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Execute a prompt across multiple models in parallel and return a
 * structured comparison.
 *
 * @param {string}   prompt     The raw user prompt
 * @param {string[]} [modelIds] Optional subset of model IDs to run
 * @returns {Promise<MultiModelResult>}
 *
 * @example
 * const result = await runMultiModel("Explain quantum computing", ["gpt-4o", "gpt-4o-mini"]);
 * console.log(result.comparison.fastest);     // "gpt-4o-mini"
 * console.log(result.comparison.cheapest);    // "gpt-4o-mini"
 * console.log(result.results[0].latency);     // 412
 */
async function runMultiModel(prompt, modelIds) {
  const selected = Array.isArray(modelIds) && modelIds.length > 0
    ? modelIds
    : DEFAULT_MODELS;

  // Count input tokens once — shared across all models
  const inputTokens = await countTokens(prompt);

  // ── Run all models in parallel ───────────────────────────────────────────
  const settled = await Promise.allSettled(
    selected.map((id) => _executeSingleModel(id, prompt, inputTokens))
  );

  // Separate successes from failures
  const results  = [];
  const failures = [];

  settled.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      results.push(outcome.value);
    } else {
      failures.push({
        model: selected[i],
        error: outcome.reason?.message ?? "Unknown error",
      });
    }
  });

  // ── Build structured comparison ──────────────────────────────────────────
  const comparison = _buildComparison(results);

  return {
    prompt,
    inputTokens,
    modelsRequested: selected.length,
    modelsSucceeded: results.length,
    modelsFailed:    failures.length,
    results,
    failures: failures.length > 0 ? failures : undefined,
    comparison,
  };
}

// ── Private helpers ────────────────────────────────────────────────────────

/**
 * Execute a single model, measuring latency and computing all metrics.
 *
 * @param {string} modelId
 * @param {string} prompt
 * @param {number} inputTokens
 * @returns {Promise<ModelResult>}
 */
async function _executeSingleModel(modelId, prompt, inputTokens) {
  const t0 = Date.now();

  // 1. Execute (real API or simulation)
  const execution = await modelRunner.execute(modelId, prompt, {});
  const latency   = Date.now() - t0;

  // 2. Count output tokens
  const outputTokens = await countTokens(execution.output);
  const totalTokens  = inputTokens + outputTokens;

  // 3. Cost (live/cached pricing)
  const costData = await estimateCostLive(modelId, inputTokens, outputTokens);

  // 4. Energy
  const energyData = estimateEnergy(modelId, totalTokens);

  // 5. Quality score
  const { score: qualityScore } = await evaluate(prompt, execution.output);

  return {
    model:            modelId,
    latency,                                // ms
    inputTokens,
    outputTokens,
    totalTokens,
    cost:             costData.totalCost,   // USD
    costBreakdown: {
      input:        costData.inputCost,
      output:       costData.outputCost,
      currency:     costData.currency,
      priceSource:  costData.priceSource,
    },
    energy:           energyData.energy,    // Wh
    energyConfidence: energyData.confidence,
    qualityScore,                           // 1–10
    output:           execution.output,
    simulated:        execution.simulated ?? false,
  };
}

/**
 * Build a ranked comparison across all completed model results.
 *
 * @param {ModelResult[]} results
 * @returns {object}
 */
function _buildComparison(results) {
  if (results.length === 0) {
    return { fastest: null, cheapest: null, highestQuality: null, mostEfficient: null, rankings: [] };
  }

  // Sort copies — don't mutate the original array
  const byLatency = [...results].sort((a, b) => a.latency - b.latency);
  const byCost    = [...results].sort((a, b) => a.cost - b.cost);
  const byQuality = [...results].sort((a, b) => b.qualityScore - a.qualityScore);
  const byEnergy  = [...results].sort((a, b) => a.energy - b.energy);

  // Efficiency = quality / cost  (higher is better, avoid div-by-zero)
  const byEfficiency = [...results].sort((a, b) => {
    const effA = a.cost > 0 ? a.qualityScore / a.cost : Infinity;
    const effB = b.cost > 0 ? b.qualityScore / b.cost : Infinity;
    return effB - effA;
  });

  // Build per-model rank table
  const rankings = results.map((r) => {
    const model = r.model;
    return {
      model,
      rankLatency:    byLatency.findIndex((x) => x.model === model) + 1,
      rankCost:       byCost.findIndex((x) => x.model === model) + 1,
      rankQuality:    byQuality.findIndex((x) => x.model === model) + 1,
      rankEnergy:     byEnergy.findIndex((x) => x.model === model) + 1,
      rankEfficiency: byEfficiency.findIndex((x) => x.model === model) + 1,
    };
  });

  return {
    fastest:        byLatency[0].model,
    cheapest:       byCost[0].model,
    highestQuality: byQuality[0].model,
    lowestEnergy:   byEnergy[0].model,
    mostEfficient:  byEfficiency[0].model,
    rankings,
  };
}

module.exports = { runMultiModel, DEFAULT_MODELS };
