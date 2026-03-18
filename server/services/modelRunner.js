/**
 * Model execution service.
 * Calls OpenAI when an API key is present, otherwise returns high-quality
 * simulated responses so the dashboard is fully functional without a key.
 */

const { buildJudgeSystemPrompt, computeWeightedScore } = require("../utils/qualityScorer");

let openai = null;

function getClient() {
  if (openai) return openai;
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-your")) {
    const { OpenAI } = require("openai");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai;
  }
  return null;
}

// ── Real execution ─────────────────────────────────────────

async function callOpenAI(modelId, prompt, options = {}) {
  const client = getClient();
  if (!client) return null;

  // Only OpenAI models can be called directly
  const openAIModels = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
  if (!openAIModels.includes(modelId)) return null;

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt },
    ],
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature ?? 0.7,
  });

  return {
    output: response.choices[0]?.message?.content || "",
    simulated: false,
    usage: response.usage,
  };
}

// ── Simulated execution ────────────────────────────────────

const SIMULATED_STYLES = {
  "gpt-4o": {
    prefix: "[GPT-4o Simulated] ",
    quality: "high",
    verbosity: 1.0,
  },
  "gpt-4o-mini": {
    prefix: "[GPT-4o Mini Simulated] ",
    quality: "good",
    verbosity: 0.8,
  },
  "gpt-4-turbo": {
    prefix: "[GPT-4 Turbo Simulated] ",
    quality: "high",
    verbosity: 1.1,
  },
  "gpt-3.5-turbo": {
    prefix: "[GPT-3.5 Turbo Simulated] ",
    quality: "moderate",
    verbosity: 0.7,
  },
  "claude-3-opus": {
    prefix: "[Claude 3 Opus Simulated] ",
    quality: "high",
    verbosity: 1.2,
  },
  "claude-3.5-sonnet": {
    prefix: "[Claude 3.5 Sonnet Simulated] ",
    quality: "high",
    verbosity: 1.0,
  },
  "gemini-1.5-pro": {
    prefix: "[Gemini 1.5 Pro Simulated] ",
    quality: "good",
    verbosity: 0.9,
  },
  "llama-3-70b": {
    prefix: "[Llama 3 70B Simulated] ",
    quality: "good",
    verbosity: 0.85,
  },
};

function simulateResponse(modelId, prompt) {
  const style = SIMULATED_STYLES[modelId] || SIMULATED_STYLES["gpt-3.5-turbo"];
  const words = prompt.trim().split(/\s+/);
  const topic = words.slice(0, 8).join(" ");

  const baseResponse = `This is a simulated response for the prompt about "${topic}". ` +
    `In a production environment with a valid API key, this would contain a real AI-generated response from ${modelId}. ` +
    `The analysis pipeline (token counting, cost estimation, energy estimation, and quality scoring) ` +
    `uses real calculations regardless of whether the model response is simulated. ` +
    `Key observations about your prompt: it contains ${words.length} words and appears to be a ` +
    `${words.length > 20 ? "detailed" : "concise"} request. ` +
    `The prompt ${prompt.includes("?") ? "asks a question" : "provides an instruction"}, ` +
    `which would typically receive a ${style.quality}-quality response from ${modelId}.`;

  // Add variability per model
  const extra = style.verbosity > 1
    ? ` Additionally, ${modelId} would typically provide more comprehensive analysis with supporting details and examples.`
    : style.verbosity < 0.8
      ? ""
      : ` The response quality is characteristic of ${modelId}'s typical output.`;

  // Simulate latency variation
  const baseLatency = { "gpt-4o": 800, "gpt-4-turbo": 1200, "gpt-3.5-turbo": 400, "gpt-4o-mini": 350 };
  const delay = (baseLatency[modelId] || 600) + Math.random() * 300;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        output: style.prefix + baseResponse + extra,
        simulated: true,
      });
    }, Math.min(delay, 200)); // cap simulated delay for dev speed
  });
}

// ── Public API ─────────────────────────────────────────────

/**
 * Execute a prompt against a model (real or simulated).
 */
async function execute(modelId, prompt, options = {}) {
  // Try real API call first
  const real = await callOpenAI(modelId, prompt, options).catch(() => null);
  if (real) return real;

  // Fallback to simulation
  return simulateResponse(modelId, prompt);
}

/**
 * Use LLM as a judge to score output quality.
 */
async function judge(prompt, output) {
  const client = getClient();
  if (!client) throw new Error("No API key for judge");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini", // cost-effective for judging
    messages: [
      { role: "system", content: buildJudgeSystemPrompt() },
      {
        role: "user",
        content: `PROMPT:\n${prompt}\n\nRESPONSE:\n${output}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      scores: parsed.scores,
      overallScore: parsed.overallScore || computeWeightedScore(parsed.scores),
      summary: parsed.summary || "Evaluated by LLM judge",
    };
  } catch {
    throw new Error("Judge returned invalid JSON");
  }
}

module.exports = { execute, judge };
