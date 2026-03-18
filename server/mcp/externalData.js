/**
 * MCP — External data fetching module.
 * Provides a pluggable layer for pulling model metadata, benchmark scores,
 * or pricing data from external APIs. Currently uses static defaults with
 * hooks for live data.
 */

const https = require("https");

/**
 * Generic JSON fetcher (GET).
 * @param {string} url
 * @param {Record<string,string>} [headers]
 * @returns {Promise<any>}
 */
function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Failed to parse JSON from external source"));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("External request timed out"));
    });
  });
}

/**
 * Fetch latest model benchmark scores from an external leaderboard.
 * Stub — returns cached data; swap in a real URL when available.
 */
async function fetchBenchmarkScores() {
  // In production, replace with a real API call:
  // return fetchJSON("https://api.example.com/benchmarks");
  return {
    source: "static-cache",
    updatedAt: new Date().toISOString(),
    benchmarks: {
      "gpt-4o":          { mmlu: 88.7, humanEval: 90.2, arc: 96.4 },
      "gpt-4o-mini":     { mmlu: 82.0, humanEval: 87.0, arc: 93.1 },
      "gpt-4-turbo":     { mmlu: 86.4, humanEval: 87.1, arc: 96.3 },
      "gpt-3.5-turbo":   { mmlu: 70.0, humanEval: 48.1, arc: 85.2 },
      "claude-3-opus":   { mmlu: 86.8, humanEval: 84.9, arc: 96.4 },
      "claude-3.5-sonnet": { mmlu: 88.7, humanEval: 92.0, arc: 96.7 },
      "gemini-1.5-pro":  { mmlu: 85.9, humanEval: 71.9, arc: 93.0 },
      "llama-3-70b":     { mmlu: 82.0, humanEval: 81.7, arc: 93.0 },
    },
  };
}

/**
 * Fetch live pricing (stub — mirrors pricingEngine for now).
 */
async function fetchLivePricing() {
  const { getAllModels } = require("../utils/pricingEngine");
  return {
    source: "local-config",
    updatedAt: new Date().toISOString(),
    models: getAllModels(),
  };
}

module.exports = { fetchJSON, fetchBenchmarkScores, fetchLivePricing };
