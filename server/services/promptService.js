/**
 * promptService.js
 *
 * Core service for POST /analyze-prompt.
 * Orchestrates multi-model execution + prompt optimization.
 *
 * Delegates parallel model runs to multiModelService and prompt
 * rewriting to optimizerService — keeps this file thin.
 */

"use strict";

const { runMultiModel }        = require("./multiModelService");
const { optimizePrompt }       = require("./optimizerService");

/**
 * Analyse a prompt against multiple models and return the full result.
 *
 * @param {string}   prompt          Raw user prompt
 * @param {string[]} [selectedModels] Optional subset of model names to run
 * @returns {Promise<AnalyzeResult>}
 */
async function analyzePrompt(prompt, selectedModels) {
  // 1. Run prompt across all models in parallel (tokens, latency, cost, energy, quality)
  const multiResult = await runMultiModel(prompt, selectedModels);

  // 2. Optimise the prompt and explain what changed
  const { improvedPrompt, improvements } = await optimizePrompt(prompt);

  // 3. Map multi-model results to the contracted API shape
  const models = multiResult.results.map((r) => ({
    name:             r.model,
    inputTokens:      r.inputTokens,
    outputTokens:     r.outputTokens,
    latency:          r.latency,
    cost:             r.cost,
    energy:           r.energy,
    energyConfidence: r.energyConfidence,
    qualityScore:     r.qualityScore,
    priceSource:      r.costBreakdown.priceSource,
    output:           r.output,
    simulated:        r.simulated,
  }));

  return {
    tokens:          multiResult.inputTokens,
    models,
    comparison:      multiResult.comparison,
    optimizedPrompt: improvedPrompt,
    improvements,
  };
}

module.exports = { analyzePrompt };

