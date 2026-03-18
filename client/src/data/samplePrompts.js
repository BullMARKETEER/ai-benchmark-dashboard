/**
 * Curated sample prompts across different categories.
 * Each entry shows a different prompt style so users can
 * compare how models & cost/quality differ by use-case.
 */

const SAMPLE_PROMPTS = [
  {
    id: "simple-qa",
    category: "Q&A",
    label: "Simple Q&A",
    emoji: "❓",
    prompt: "What is the capital of France?",
  },
  {
    id: "code-gen",
    category: "Code",
    label: "Code Generation",
    emoji: "💻",
    prompt:
      "Write a Python function that takes a list of integers and returns the two numbers that add up to a given target sum. Include type hints and a brief docstring.",
  },
  {
    id: "chain-of-thought",
    category: "Reasoning",
    label: "Chain-of-Thought",
    emoji: "🧠",
    prompt:
      "A train leaves Station A at 9:00 AM travelling at 80 km/h. Another train leaves Station B (320 km away) at 10:00 AM travelling toward Station A at 100 km/h. At what time do they meet? Think step by step.",
  },
  {
    id: "creative-writing",
    category: "Creative",
    label: "Creative Writing",
    emoji: "✍️",
    prompt:
      "Write a short three-paragraph story about an astronaut who discovers an ancient library on the Moon. The tone should be mysterious and wonder-filled.",
  },
  {
    id: "summarisation",
    category: "Summarisation",
    label: "Summarisation",
    emoji: "📝",
    prompt:
      "Summarise the key differences between REST and GraphQL APIs in bullet points. Include trade-offs for when to use each, targeting a mid-level software engineer audience.",
  },
  {
    id: "structured-output",
    category: "Structured",
    label: "Structured JSON Output",
    emoji: "🗂️",
    prompt:
      'Extract the following fields from the text below and return valid JSON only: name, email, company, role.\n\nText: "Hi, I\'m Sarah Chen, a Senior Product Manager at Acme Corp. You can reach me at sarah.chen@acme.io."',
  },
  {
    id: "role-expert",
    category: "Role + Expert",
    label: "Expert Role",
    emoji: "🎓",
    prompt:
      "You are a senior cardiologist. Explain what atrial fibrillation is, its common causes, and the first-line treatment options in plain language suitable for a newly diagnosed patient.",
  },
  {
    id: "few-shot",
    category: "Few-Shot",
    label: "Few-Shot Learning",
    emoji: "🎯",
    prompt:
      "Classify the sentiment of each sentence as Positive, Negative, or Neutral.\n\nExamples:\n- \"The product arrived on time.\" → Positive\n- \"The package was completely damaged.\" → Negative\n- \"The item is available in three colours.\" → Neutral\n\nNow classify:\n- \"I waited three weeks and still haven't received my order.\"\n- \"The battery life is surprisingly good.\"\n- \"Returns are processed within 5–7 business days.\"",
  },
  {
    id: "translation",
    category: "Translation",
    label: "Translation + Tone",
    emoji: "🌐",
    prompt:
      "Translate the following English text into Spanish, French, and Japanese. Preserve a formal professional tone.\n\nText: \"We are pleased to inform you that your application has been approved. Please review the attached documents and respond at your earliest convenience.\"",
  },
  {
    id: "optimisation-target",
    category: "Vague (Needs Optimising)",
    label: "Vague Prompt",
    emoji: "⚠️",
    prompt: "tell me something about machine learning stuff etc",
  },
];

export default SAMPLE_PROMPTS;
