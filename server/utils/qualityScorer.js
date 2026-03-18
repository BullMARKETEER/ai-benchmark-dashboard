/**
 * Quality scoring criteria used by the LLM judge.
 */

const QUALITY_RUBRIC = {
  relevance: {
    weight: 0.25,
    description: "How well the output addresses the prompt's intent",
  },
  accuracy: {
    weight: 0.25,
    description: "Factual correctness and absence of hallucinations",
  },
  coherence: {
    weight: 0.2,
    description: "Logical flow and readability of the response",
  },
  completeness: {
    weight: 0.15,
    description: "Whether the response fully covers all aspects of the prompt",
  },
  conciseness: {
    weight: 0.15,
    description: "Avoidance of unnecessary filler; information density",
  },
};

/**
 * Build the LLM judge system prompt.
 */
function buildJudgeSystemPrompt() {
  const criteria = Object.entries(QUALITY_RUBRIC)
    .map(([key, { description }]) => `- **${key}**: ${description}`)
    .join("\n");

  return `You are an expert AI output evaluator. Score the following AI-generated response on a 1-10 scale for each criterion:

${criteria}

Return ONLY valid JSON with this exact shape — no markdown, no explanation:
{
  "scores": {
    "relevance": <number>,
    "accuracy": <number>,
    "coherence": <number>,
    "completeness": <number>,
    "conciseness": <number>
  },
  "overallScore": <weighted average, 1-10>,
  "summary": "<one-sentence qualitative summary>"
}`;
}

/**
 * Compute a weighted overall score from individual criteria scores.
 */
function computeWeightedScore(scores) {
  let total = 0;
  for (const [key, { weight }] of Object.entries(QUALITY_RUBRIC)) {
    total += (scores[key] || 5) * weight;
  }
  return +total.toFixed(2);
}

module.exports = { QUALITY_RUBRIC, buildJudgeSystemPrompt, computeWeightedScore };
