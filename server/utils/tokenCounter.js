/**
 * Token counting utility using tiktoken.
 * Falls back to a heuristic estimator if tiktoken fails to load.
 */

let encoder = null;

async function getEncoder() {
  if (encoder) return encoder;
  try {
    const { encoding_for_model } = require("tiktoken");
    encoder = encoding_for_model("gpt-4o");
    return encoder;
  } catch {
    // Fallback: ~4 chars per token for English text
    return null;
  }
}

/**
 * Count tokens for a given text string.
 * @param {string} text
 * @returns {Promise<number>}
 */
async function countTokens(text) {
  const enc = await getEncoder();
  if (enc) {
    const tokens = enc.encode(text);
    return tokens.length;
  }
  // Heuristic fallback
  return Math.ceil(text.length / 4);
}

/**
 * Tokenize and return both count and per-word breakdown.
 * @param {string} text
 * @returns {Promise<{totalTokens: number, charCount: number, wordCount: number}>}
 */
async function tokenize(text) {
  const totalTokens = await countTokens(text);
  return {
    totalTokens,
    charCount: text.length,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
  };
}

module.exports = { countTokens, tokenize };
