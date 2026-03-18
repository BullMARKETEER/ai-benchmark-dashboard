"use strict";

/**
 * services/energyService.js
 *
 * Energy estimation service.
 *
 * Formula:
 *   energy (Wh) = tokens × model_factor
 *
 * Model factors (Wh per token):
 *   small  → 0.00005  Wh/token
 *   medium → 0.0001   Wh/token
 *   large  → 0.0005   Wh/token
 *
 * Confidence reflects how precisely the model size is known:
 *   "high"   — model is explicitly mapped to a size tier
 *   "medium" — model matches a known provider but size is inferred
 *   "low"    — model is unrecognised; default factor used
 *
 * Public API:
 *   estimateEnergy(modelId, tokens)  → { energy, confidence }
 *   getModelSize(modelId)            → "small" | "medium" | "large" | null
 *   MODEL_SIZE_MAP                   → full mapping table (exported for tests)
 *   SIZE_FACTORS                     → factor constants (exported for tests)
 */

// ── Factor table ─────────────────────────────────────────────────────────────
/**
 * Wh consumed per single token (input or output).
 * Derivation sketch:
 *   small  models (~7–13 B params)  : ~0.00005 Wh/token
 *   medium models (~30–70 B params) : ~0.0001  Wh/token
 *   large  models (~175 B+ params)  : ~0.0005  Wh/token
 */
const SIZE_FACTORS = {
  small:  0.00005,
  medium: 0.0001,
  large:  0.0005,
};

// ── Model → size mapping ──────────────────────────────────────────────────────
// Each entry carries:
//   size       : "small" | "medium" | "large"
//   confidence : "high" | "medium"   (unknown models get "low" at runtime)
const MODEL_SIZE_MAP = {
  // OpenAI
  "gpt-4o":            { size: "large",  confidence: "high"   },
  "gpt-4o-mini":       { size: "small",  confidence: "high"   },
  "gpt-4-turbo":       { size: "large",  confidence: "high"   },
  "gpt-3.5-turbo":     { size: "medium", confidence: "high"   },
  "gpt-4":             { size: "large",  confidence: "high"   },
  // Anthropic
  "claude-3-opus":     { size: "large",  confidence: "high"   },
  "claude-3-sonnet":   { size: "medium", confidence: "high"   },
  "claude-3.5-sonnet": { size: "medium", confidence: "high"   },
  "claude-3-haiku":    { size: "small",  confidence: "high"   },
  // Google
  "gemini-1.5-pro":    { size: "large",  confidence: "high"   },
  "gemini-1.5-flash":  { size: "medium", confidence: "high"   },
  "gemini-1.0-pro":    { size: "medium", confidence: "high"   },
  // Meta / open-source
  "llama-3-70b":       { size: "large",  confidence: "high"   },
  "llama-3-8b":        { size: "small",  confidence: "high"   },
  "llama-2-70b":       { size: "large",  confidence: "high"   },
  "llama-2-13b":       { size: "medium", confidence: "high"   },
  "llama-2-7b":        { size: "small",  confidence: "high"   },
  "mistral-7b":        { size: "small",  confidence: "high"   },
  "mixtral-8x7b":      { size: "medium", confidence: "high"   },
  // Inferred / partial matches handled below at runtime
};

// ── Default fallback for unrecognised models ────────────────────────────────
const DEFAULT_SIZE   = "medium";
const DEFAULT_FACTOR = SIZE_FACTORS[DEFAULT_SIZE];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the size tier and confidence for a given modelId.
 * Falls back to partial prefix matching (e.g. "gpt-4o-..." → large, medium confidence),
 * then to the default if nothing matches.
 *
 * @param {string} modelId
 * @returns {{ size: string, confidence: string }}
 */
function _resolveSize(modelId) {
  // 1. Exact match
  if (MODEL_SIZE_MAP[modelId]) return MODEL_SIZE_MAP[modelId];

  // 2. Prefix match — catches versioned names like "gpt-4o-2024-08-06"
  const prefix = Object.keys(MODEL_SIZE_MAP).find((k) => modelId.startsWith(k));
  if (prefix) return { size: MODEL_SIZE_MAP[prefix].size, confidence: "medium" };

  // 3. Heuristic keyword scan
  const id = modelId.toLowerCase();
  if (/(mini|small|flash|haiku|7b|8b|nano)/.test(id)) return { size: "small",  confidence: "medium" };
  if (/(medium|13b|20b|30b|mixtral)/.test(id))         return { size: "medium", confidence: "medium" };
  if (/(large|opus|ultra|70b|180b|pro|turbo|gpt-4)/.test(id)) return { size: "large", confidence: "medium" };

  // 4. Unknown — use default
  return { size: DEFAULT_SIZE, confidence: "low" };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Estimate energy consumption for a model run.
 *
 * @param {string} modelId   - Model identifier (e.g. "gpt-4o-mini")
 * @param {number} tokens    - Total tokens processed (input + output)
 * @returns {{ energy: number, confidence: "low" | "medium" | "high" }}
 *
 * @example
 * estimateEnergy("gpt-4o-mini", 500)
 * // → { energy: 0.025, confidence: "high" }
 *
 * estimateEnergy("some-unknown-model", 500)
 * // → { energy: 0.05, confidence: "low" }
 */
function estimateEnergy(modelId, tokens) {
  if (typeof tokens !== "number" || tokens < 0) {
    throw new TypeError(`tokens must be a non-negative number, got ${tokens}`);
  }

  const { size, confidence } = _resolveSize(modelId);
  const factor = SIZE_FACTORS[size] ?? DEFAULT_FACTOR;
  const energy = +(tokens * factor).toFixed(8);

  return { energy, confidence };
}

/**
 * Return the resolved size tier for a model, or null if completely unknown.
 *
 * @param {string} modelId
 * @returns {"small" | "medium" | "large" | null}
 */
function getModelSize(modelId) {
  const { size, confidence } = _resolveSize(modelId);
  return confidence === "low" ? null : size;
}

module.exports = {
  estimateEnergy,
  getModelSize,
  MODEL_SIZE_MAP,
  SIZE_FACTORS,
};
