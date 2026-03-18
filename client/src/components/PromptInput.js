import React, { useState } from "react";
import { useModels } from "../hooks/useModels";
import SAMPLE_PROMPTS from "../data/samplePrompts";
import { estimateTokens } from "../utils/tokenizer";

/**
 * Prompt input form with:
 *   - Sample prompt browser (category-filtered)
 *   - Resizable textarea with live token/word/char counts
 *   - Model selector toggle buttons
 *   - Gradient submit button with loading spinner
 */
export default function PromptInput({ onAnalyze, loading }) {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const { models } = useModels();

  const categories = ["All", ...new Set(SAMPLE_PROMPTS.map((p) => p.category))];
  const filtered =
    !activeCategory || activeCategory === "All"
      ? SAMPLE_PROMPTS
      : SAMPLE_PROMPTS.filter((p) => p.category === activeCategory);

  const toggleModel = (id) =>
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onAnalyze(prompt.trim(), selectedModels.length > 0 ? selectedModels : undefined);
  };

  const { tokens: estTokens, words: wordCount, characters: charCount } = estimateTokens(prompt);

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {/* ── Sample Prompts ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Sample Prompts
          </p>
          <div className="flex gap-1 flex-wrap justify-end">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat === "All" ? null : cat)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  (cat === "All" && !activeCategory) || activeCategory === cat
                    ? "bg-brand-600/30 text-brand-300 ring-1 ring-brand-600/40"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPrompt(s.prompt)}
              title={s.prompt}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap ${
                prompt === s.prompt
                  ? "border-brand-500 bg-brand-600/20 text-brand-300"
                  : "border-gray-800 bg-gray-800/30 text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Textarea ──────────────────────────────────────── */}
      <div>
        <label htmlFor="prompt" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Your Prompt
        </label>
        <textarea
          id="prompt"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type or paste your AI prompt here…"
          className="w-full rounded-lg border-gray-700/60 bg-gray-800/40 text-gray-100 placeholder-gray-600
                     focus:border-brand-500 focus:ring-brand-500/20 text-sm font-mono resize-y
                     transition-colors"
        />
        <div className="flex justify-between mt-1.5 text-[11px] text-gray-600 tabular-nums">
          <span>{wordCount} words · {charCount} chars</span>
          <span className="text-brand-400/70">~{estTokens} tokens</span>
        </div>
      </div>

      {/* ── Model selector ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Models
          </p>
          <span className="text-[10px] text-gray-600">
            {selectedModels.length === 0
              ? "All models (default)"
              : `${selectedModels.length} selected`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => toggleModel(model.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedModels.includes(model.id)
                  ? "border-brand-500 bg-brand-600/15 text-brand-300 shadow-sm shadow-brand-500/10"
                  : "border-gray-800 bg-gray-800/30 text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {model.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* ── Submit ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600
                     text-white font-semibold text-sm
                     shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all duration-150"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Analyzing…
            </span>
          ) : (
            "Analyze Prompt"
          )}
        </button>
        {prompt.trim() && !loading && (
          <button
            type="button"
            onClick={() => { setPrompt(""); setSelectedModels([]); }}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
