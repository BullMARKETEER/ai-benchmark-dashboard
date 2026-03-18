"use strict";

/**
 * services/evaluatorService.js
 *
 * Evaluates an AI-generated response using OpenAI as a judge.
 *
 * Evaluation prompt:
 *   "Rate this response on accuracy, clarity, and completeness
 *    from 1 to 10. Return only a number."
 *
 * Returns:
 *   { score: number }   — integer 1–10
 *
 * Guarantees:
 *   - Up to MAX_RETRIES attempts if the model returns non-numeric output
 *   - Temperature increases slightly on each retry to escape repetitive bad output
 *   - Falls back to a heuristic scorer if all retries are exhausted or no API key
 *   - Never throws — always resolves with a valid { score }
 */

const MAX_RETRIES    = 3;
const JUDGE_MODEL    = "gpt-4o-mini"; // cheap + fast for single-number evals
const SCORE_MIN      = 1;
const SCORE_MAX      = 10;
const BASE_TEMP      = 0.1; // deterministic by default
const RETRY_TEMP_INC = 0.15; // bump per retry to escape stuck outputs

// ── OpenAI client ─────────────────────────────────────────────────────────────
let _openai = null;

function _getClient() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("sk-your")) return null;
  const { OpenAI } = require("openai");
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

// ── Prompt builder ────────────────────────────────────────────────────────────
/**
 * Build the evaluation messages for the judge call.
 *
 * @param {string} prompt   - Original user prompt
 * @param {string} response - AI-generated response to evaluate
 * @returns {Array}  OpenAI messages array
 */
function _buildMessages(prompt, response) {
  return [
    {
      role: "system",
      content:
        "You are a strict evaluator. You will be given an AI-generated response and " +
        "must rate it on accuracy, clarity, and completeness on a scale from 1 to 10. " +
        "Return ONLY a single integer between 1 and 10. No explanation, no punctuation, no extra text.",
    },
    {
      role: "user",
      content:
        `ORIGINAL PROMPT:\n${prompt}\n\n` +
        `AI RESPONSE:\n${response}\n\n` +
        "Rate this response on accuracy, clarity, and completeness from 1 to 10. " +
        "Return only a number.",
    },
  ];
}

// ── Parser ────────────────────────────────────────────────────────────────────
/**
 * Parse the raw model output into a valid integer score.
 *
 * Handles all common LLM deviations:
 *   "7"          → 7      (ideal)
 *   "7.5"        → 8      (rounds)
 *   "Score: 7"   → 7      (extracts first number)
 *   "7/10"       → 7      (takes numerator)
 *   "**7**"      → 7      (strips markdown)
 *   ""           → null   (triggers retry)
 *   "eleven"     → null   (triggers retry)
 *
 * @param {string} raw
 * @returns {number|null}  Integer 1–10, or null if unparseable
 */
function _parseScore(raw) {
  if (!raw || typeof raw !== "string") return null;

  // Strip markdown bold/italic, whitespace
  const cleaned = raw.replace(/[*_`]/g, "").trim();

  // Match the first numeric value (int or decimal)
  const match = cleaned.match(/\b(\d+(?:\.\d+)?)\b/);
  if (!match) return null;

  const val = Math.round(parseFloat(match[1]));

  // Reject if outside valid range
  if (val < SCORE_MIN || val > SCORE_MAX) return null;

  return val;
}

// ── Heuristic fallback ────────────────────────────────────────────────────────
/**
 * Score a response heuristically when OpenAI is unavailable or retries fail.
 * Uses surface features: length, sentence count, avg word length.
 *
 * @param {string} response
 * @returns {number}  Integer 1–10
 */
function _heuristicScore(response) {
  const words     = response.trim().split(/\s+/).filter(Boolean);
  const sentences = response.split(/[.!?]+/).filter(Boolean).length;
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / (words.length || 1);

  // Sub-scores (1–10 each)
  const lengthScore    = Math.min(10, Math.max(1, Math.round(Math.log2(words.length + 1) * 1.8)));
  const clarityScore   = Math.min(10, Math.max(1, sentences > 1 ? 6 + Math.min(2, sentences * 0.3) : 4));
  const complexScore   = Math.min(10, Math.max(1, Math.round(avgWordLen * 1.2)));

  // Simple average, rounded to nearest int
  return Math.round((lengthScore + clarityScore + complexScore) / 3);
}

// ── Core evaluator ────────────────────────────────────────────────────────────
/**
 * Evaluate an AI response and return a score from 1 to 10.
 *
 * @param {string} prompt    - The original prompt that generated the response
 * @param {string} response  - The AI-generated response to score
 * @returns {Promise<{ score: number }>}
 *
 * @example
 * const { score } = await evaluate("Explain gravity", "Gravity is a force...");
 * // → { score: 8 }
 */
async function evaluate(prompt, response) {
  const client = _getClient();

  // No API key — use heuristic immediately
  if (!client) {
    return { score: _heuristicScore(response) };
  }

  const messages = _buildMessages(prompt, response);
  let lastError  = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const temperature = BASE_TEMP + (attempt - 1) * RETRY_TEMP_INC;

      const completion = await client.chat.completions.create({
        model:       JUDGE_MODEL,
        messages,
        max_tokens:  10,       // a single digit needs at most 3 tokens
        temperature,
      });

      const raw   = completion.choices[0]?.message?.content ?? "";
      const score = _parseScore(raw);

      if (score !== null) {
        if (attempt > 1) {
          console.debug(`[evaluatorService] Parsed score "${score}" on attempt ${attempt}.`);
        }
        return { score };
      }

      // Log the bad output and retry
      console.warn(
        `[evaluatorService] Attempt ${attempt}/${MAX_RETRIES}: ` +
        `unparseable output "${raw.slice(0, 40)}". Retrying…`
      );
      lastError = `Unparseable output: "${raw.slice(0, 40)}"`;

    } catch (err) {
      console.warn(`[evaluatorService] Attempt ${attempt}/${MAX_RETRIES} threw: ${err.message}`);
      lastError = err.message;
    }
  }

  // All retries exhausted — fall back to heuristic
  console.warn(`[evaluatorService] All ${MAX_RETRIES} attempts failed (${lastError}). Using heuristic fallback.`);
  return { score: _heuristicScore(response) };
}

module.exports = {
  evaluate,
  // Exported for unit testing
  _parseScore,
  _heuristicScore,
  MAX_RETRIES,
  JUDGE_MODEL,
};
