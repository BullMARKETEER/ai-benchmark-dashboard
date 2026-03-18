/**
 * Prompt analysis orchestrator.
 * Coordinates token counting → multi-model execution → cost/energy estimation
 * → quality scoring → optimization suggestions.
 */

const { v4: uuidv4 } = require("uuid");
const { tokenize, countTokens } = require("../utils/tokenCounter");
const { estimateCost, getAllModels } = require("../utils/pricingEngine");
const { estimateEnergy } = require("../utils/energyEstimator");
const { buildJudgeSystemPrompt, computeWeightedScore } = require("../utils/qualityScorer");
const modelRunner = require("./modelRunner");
const optimizerService = require("./optimizerService");

// In-memory results store
const resultsStore = new Map();

/**
 * Full analysis pipeline.
 * @param {{ prompt: string, models?: string[], options?: object }} params
 * @returns {Promise<object>}
 */
async function analyzePrompt({ prompt, models, options = {} }) {
  const id = uuidv4();
  const startTime = Date.now();

  // 1. Tokenize the input prompt
  const tokenInfo = await tokenize(prompt);

  // 2. Determine which models to run
  const availableModels = getAllModels().map((m) => m.id);
  const selectedModels = (models && models.length > 0)
    ? models.filter((m) => availableModels.includes(m))
    : ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]; // sensible defaults

  // 3. Execute prompt across all selected models (parallel)
  const modelResults = await Promise.all(
    selectedModels.map((modelId) => runSingleModel(modelId, prompt, tokenInfo, options))
  );

  // 4. Generate prompt optimization suggestions
  const optimizations = await optimizerService.suggestOptimizations(prompt, tokenInfo);

  const result = {
    id,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    prompt: {
      text: prompt,
      ...tokenInfo,
    },
    models: modelResults,
    optimizations,
    summary: buildSummary(modelResults),
  };

  // Persist to in-memory store
  resultsStore.set(id, result);

  return result;
}

/**
 * Run analysis for a single model.
 */
async function runSingleModel(modelId, prompt, tokenInfo, options) {
  const execStart = Date.now();

  // Execute (real OpenAI call or simulation)
  const execution = await modelRunner.execute(modelId, prompt, options);

  // Count output tokens
  const outputTokens = await countTokens(execution.output);
  const totalTokens = tokenInfo.totalTokens + outputTokens;

  // Cost & energy
  const cost = estimateCost(modelId, tokenInfo.totalTokens, outputTokens);
  const energy = estimateEnergy(modelId, totalTokens);

  // Quality scoring (uses LLM judge or simulated scoring)
  const quality = await scoreOutput(prompt, execution.output, modelId);

  return {
    modelId,
    latencyMs: Date.now() - execStart,
    tokens: {
      input: tokenInfo.totalTokens,
      output: outputTokens,
      total: totalTokens,
    },
    cost,
    energy,
    quality,
    output: execution.output,
    simulated: execution.simulated,
  };
}

/**
 * Score an output using LLM-as-judge or fallback heuristic.
 */
async function scoreOutput(prompt, output, modelId) {
  try {
    const judgeResult = await modelRunner.judge(prompt, output);
    return {
      ...judgeResult,
      method: "llm-judge",
    };
  } catch {
    // Fallback: heuristic scoring
    return heuristicScore(output);
  }
}

function heuristicScore(output) {
  const len = output.length;
  const sentences = output.split(/[.!?]+/).filter(Boolean).length;
  const words = output.trim().split(/\s+/).length;
  const avgWordLen = output.replace(/\s+/g, "").length / (words || 1);

  const relevance = Math.min(10, 5 + sentences * 0.3);
  const coherence = Math.min(10, 4 + (avgWordLen > 3 ? 3 : 1) + (sentences > 2 ? 2 : 0));
  const completeness = Math.min(10, 3 + Math.log2(words + 1) * 1.5);
  const conciseness = len < 500 ? 8 : len < 2000 ? 6 : 4;
  const accuracy = 6; // can't truly measure without grounding

  const scores = { relevance: +relevance.toFixed(1), accuracy, coherence: +coherence.toFixed(1), completeness: +completeness.toFixed(1), conciseness };
  return {
    scores,
    overallScore: computeWeightedScore(scores),
    summary: "Scored via heuristic fallback (no API key configured)",
    method: "heuristic",
  };
}

function buildSummary(modelResults) {
  const cheapest = [...modelResults].sort((a, b) => a.cost.totalCost - b.cost.totalCost)[0];
  const fastest = [...modelResults].sort((a, b) => a.latencyMs - b.latencyMs)[0];
  const bestQuality = [...modelResults].sort((a, b) => b.quality.overallScore - a.quality.overallScore)[0];
  const greenest = [...modelResults].sort((a, b) => a.energy.carbonGrams - b.energy.carbonGrams)[0];

  return {
    cheapestModel: cheapest?.modelId,
    fastestModel: fastest?.modelId,
    highestQualityModel: bestQuality?.modelId,
    lowestCarbonModel: greenest?.modelId,
    totalModelsCompared: modelResults.length,
  };
}

function getResult(id) {
  return resultsStore.get(id) || null;
}

function getAllResults() {
  return [...resultsStore.values()].sort((a, b) =>
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

module.exports = { analyzePrompt, getResult, getAllResults };
