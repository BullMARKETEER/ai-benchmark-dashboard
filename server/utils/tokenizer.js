/**
 * utils/tokenizer.js
 *
 * Lightweight, synchronous token estimator.
 * No external dependencies — safe to use in any context.
 *
 * Algorithm:
 *   words  = whitespace-delimited tokens in the text
 *   tokens ≈ words × 1.3  (accounts for sub-word splits on punctuation,
 *                           numbers, and non-ASCII characters)
 *
 * For production-grade accuracy use tokenCounter.js (tiktoken-backed).
 * Use this utility when you need a fast, synchronous estimate — e.g.
 * live character-count previews, budget guards, or unit tests.
 */

"use strict";

/**
 * Estimate token count and return a breakdown object.
 *
 * @param {string} text  - The input prompt or text to measure.
 * @returns {{ tokens: number, words: number, characters: number }}
 *
 * @example
 * const { tokens, words, characters } = estimateTokens("Hello, world!");
 * // → { tokens: 4, words: 2, characters: 13 }
 */
function estimateTokens(text) {
  if (typeof text !== "string") {
    throw new TypeError(`estimateTokens expects a string, got ${typeof text}`);
  }

  const characters = text.length;

  // Split on any run of whitespace; filter out empty strings that arise
  // from leading/trailing whitespace.
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  // Round to nearest integer — fractional tokens have no meaning.
  const tokens = Math.round(words * 1.3);

  return { tokens, words, characters };
}

module.exports = { estimateTokens };
