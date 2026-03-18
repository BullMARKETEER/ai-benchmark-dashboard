/**
 * utils/tokenizer.js  (client)
 *
 * Lightweight, synchronous token estimator for use in React components.
 * Mirror of server/utils/tokenizer.js — keep both in sync.
 *
 * Algorithm:
 *   words  = whitespace-delimited tokens in the text
 *   tokens ≈ words × 1.3  (accounts for sub-word splits on punctuation,
 *                           numbers, and non-ASCII characters)
 *
 * @example
 * import { estimateTokens } from "../utils/tokenizer";
 * const { tokens, words, characters } = estimateTokens(promptText);
 */

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
export function estimateTokens(text) {
  if (typeof text !== "string") {
    throw new TypeError(`estimateTokens expects a string, got ${typeof text}`);
  }

  const characters = text.length;

  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  // Round to nearest integer — fractional tokens have no meaning.
  const tokens = Math.round(words * 1.3);

  return { tokens, words, characters };
}
