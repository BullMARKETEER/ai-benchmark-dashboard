/**
 * Prompt optimization service.
 * Analyzes a prompt and suggests concrete improvements.
 */

const OPTIMIZATION_RULES = [
  {
    id: "add-context",
    check: (prompt) => prompt.split(/\s+/).length < 10,
    title: "Add more context",
    description: "Your prompt is very short. Adding context, constraints, or examples typically improves output quality by 30-50%.",
    impact: "high",
  },
  {
    id: "specify-format",
    check: (prompt) => !/\b(json|list|table|markdown|csv|bullet|numbered|format)\b/i.test(prompt),
    title: "Specify output format",
    description: "Tell the model exactly how to structure its response (e.g., 'Respond in JSON', 'Use bullet points'). This reduces ambiguity and post-processing effort.",
    impact: "medium",
  },
  {
    id: "add-role",
    check: (prompt) => !/\b(you are|act as|role|expert|specialist|assume)\b/i.test(prompt),
    title: "Assign a role or persona",
    description: "Starting with 'You are an expert in…' activates domain-specific knowledge and improves response quality.",
    impact: "medium",
  },
  {
    id: "add-examples",
    check: (prompt) => !/\b(example|e\.g\.|for instance|such as|like this)\b/i.test(prompt),
    title: "Include examples (few-shot)",
    description: "Providing 1-3 examples of desired input/output dramatically improves accuracy, especially for structured tasks.",
    impact: "high",
  },
  {
    id: "reduce-ambiguity",
    check: (prompt) => /\b(something|stuff|things|etc|maybe|perhaps|might)\b/i.test(prompt),
    title: "Remove vague language",
    description: "Replace words like 'something', 'stuff', 'etc.' with specific terms. Precision in prompts leads to precision in outputs.",
    impact: "medium",
  },
  {
    id: "add-constraints",
    check: (prompt) => !/\b(must|should|limit|maximum|minimum|at least|no more than|constraint|require)\b/i.test(prompt),
    title: "Add constraints or boundaries",
    description: "Set explicit limits (word count, scope, topics to avoid) to keep the response focused and useful.",
    impact: "low",
  },
  {
    id: "chain-of-thought",
    check: (prompt) => !/\b(step by step|think through|reason|explain your|chain of thought|let's think)\b/i.test(prompt),
    title: "Request step-by-step reasoning",
    description: "Adding 'Think step by step' or 'Explain your reasoning' significantly improves accuracy on complex tasks.",
    impact: "high",
  },
  {
    id: "token-efficiency",
    check: (_prompt, tokenInfo) => tokenInfo.totalTokens > 500,
    title: "Optimize token usage",
    description: "Your prompt uses many tokens. Consider condensing repetitive instructions or moving static context to a system message to reduce cost.",
    impact: "low",
  },
];

/**
 * Analyze a prompt and return applicable optimization suggestions.
 * @param {string} prompt
 * @param {{ totalTokens: number }} tokenInfo
 * @returns {Promise<object[]>}
 */
async function suggestOptimizations(prompt, tokenInfo) {
  const applicable = OPTIMIZATION_RULES
    .filter((rule) => rule.check(prompt, tokenInfo))
    .map(({ id, title, description, impact }) => ({ id, title, description, impact }));

  // Compute a prompt quality score (0-100)
  const totalRules = OPTIMIZATION_RULES.length;
  const passedRules = totalRules - applicable.length;
  const promptScore = Math.round((passedRules / totalRules) * 100);

  return {
    promptScore,
    suggestions: applicable,
    totalChecks: totalRules,
    passed: passedRules,
  };
}

// ── Optimized prompt builder ────────────────────────────────────────────────

// Shared OpenAI client accessor
let _openai = null;
function _getClient() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("sk-your")) return null;
  const { OpenAI } = require("openai");
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

/**
 * Optimise a prompt and explain every improvement made.
 *
 * Uses OpenAI when an API key is present; falls back to deterministic
 * rule-based rewrites otherwise.
 *
 * @param {string} prompt  — raw user prompt
 * @returns {Promise<{ improvedPrompt: string, improvements: string[] }>}
 *
 * @example
 * await optimizePrompt("tell me about AI stuff etc")
 * // → {
 * //     improvedPrompt: "You are an expert ...",
 * //     improvements:   ["Assigned an expert role ...", "Removed vague words ..."]
 * //   }
 */
async function optimizePrompt(prompt) {
  const client = _getClient();

  if (client) {
    try {
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert prompt engineer. You will receive a user's AI prompt and must:\n" +
              "1. Make it more specific — replace vague words with precise terms.\n" +
              "2. Reduce ambiguity — remove filler, clarify intent.\n" +
              "3. Add structure — assign a role, specify output format, add constraints.\n\n" +
              "Return ONLY valid JSON with this exact shape (no markdown, no extra text):\n" +
              "{\n" +
              '  "improvedPrompt": "<the rewritten prompt>",\n' +
              '  "improvements": [\n' +
              '    "<one-sentence explanation of each change you made>"\n' +
              "  ]\n" +
              "}",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const raw = (res.choices[0]?.message?.content ?? "").trim();
      const parsed = _parseJSON(raw);

      if (parsed && typeof parsed.improvedPrompt === "string" && Array.isArray(parsed.improvements)) {
        return {
          improvedPrompt: parsed.improvedPrompt,
          improvements:   parsed.improvements.filter((s) => typeof s === "string" && s.length > 0),
        };
      }
      // LLM returned bad JSON → fall through to rule-based
    } catch {
      // API error → fall through
    }
  }

  // ── Fallback: deterministic rule-based rewrite ──
  return ruleBasedOptimize(prompt);
}

/**
 * Try to extract JSON from an LLM response that may be wrapped in
 * markdown code fences or have leading/trailing noise.
 *
 * @param {string} raw
 * @returns {object|null}
 */
function _parseJSON(raw) {
  // Strip ```json ... ``` wrappers
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // Try extracting the first { … } block
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* ignore */ }
    }
    return null;
  }
}

/**
 * Deterministic rule-based rewrite with bullet-point explanations.
 *
 * @param {string} prompt
 * @returns {{ improvedPrompt: string, improvements: string[] }}
 */
function ruleBasedOptimize(prompt) {
  let p = prompt.trim();
  const improvements = [];

  // 1. Assign a role if none present
  if (!/\b(you are|act as|as an?|as a)\b/i.test(p)) {
    p = `You are a knowledgeable and helpful assistant. ${p}`;
    improvements.push("Assigned an expert role to activate domain-specific knowledge.");
  }

  // 2. Remove vague filler words
  const vaguePattern = /\b(stuff|things|etc\.?|maybe|perhaps|might|something)\b/gi;
  if (vaguePattern.test(p)) {
    p = p.replace(vaguePattern, "").replace(/\s{2,}/g, " ").trim();
    improvements.push("Removed vague words (stuff, things, etc.) to increase precision.");
  }

  // 3. Add step-by-step for complex prompts
  if (p.split(/\s+/).length > 15 && !/step by step|step-by-step|think through/i.test(p)) {
    p += " Think step by step.";
    improvements.push("Added step-by-step reasoning instruction for better accuracy on complex tasks.");
  }

  // 4. Add structured output request
  if (!/\b(json|list|bullet|table|numbered|format|structure)\b/i.test(p)) {
    p += " Provide a clear, structured response.";
    improvements.push("Requested structured output format to reduce ambiguity.");
  }

  // 5. Add constraints if missing
  if (!/\b(must|should|limit|maximum|minimum|at least|no more than|constraint|require)\b/i.test(p)) {
    p += " Keep the response concise and focused.";
    improvements.push("Added conciseness constraint to keep the response focused.");
  }

  // 6. Ensure it ends with punctuation
  if (!/[.?!]$/.test(p)) {
    p += ".";
  }

  if (improvements.length === 0) {
    improvements.push("Prompt already follows best practices — no changes needed.");
  }

  return { improvedPrompt: p, improvements };
}

// ── Legacy compat: buildOptimizedPrompt returns string only ──
async function buildOptimizedPrompt(prompt) {
  const { improvedPrompt } = await optimizePrompt(prompt);
  return improvedPrompt;
}

module.exports = { suggestOptimizations, buildOptimizedPrompt, optimizePrompt };
