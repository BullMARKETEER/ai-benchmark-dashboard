import React, { useState } from "react";

/**
 * Shows the AI-optimized prompt and a list of specific improvements.
 *
 * Props:
 *   optimizations.optimizedPrompt  – rewritten prompt text
 *   optimizations.improvements     – array of improvement description strings
 *   optimizations.promptScore      – 0-100
 *   optimizations.suggestions      – legacy rule-based suggestions (kept for compat)
 */
export default function OptimizationPanel({ optimizations }) {
  if (!optimizations) return null;

  const { promptScore, suggestions, optimizedPrompt, improvements } = optimizations;
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const scoreColor =
    promptScore >= 75 ? "text-emerald-400" :
    promptScore >= 50 ? "text-amber-400"   : "text-red-400";

  const scoreBarColor =
    promptScore >= 75 ? "bg-emerald-500" :
    promptScore >= 50 ? "bg-amber-500"   : "bg-red-500";

  const handleCopy = () => {
    if (!optimizedPrompt) return;
    navigator.clipboard.writeText(optimizedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* Merge improvements + rule-based suggestions into a single list */
  const allImprovements = [
    ...(improvements || []).map((text, i) => ({
      id: `imp-${i}`,
      text,
      source: "ai",
    })),
    ...(suggestions || [])
      .filter((s) => s.id !== "rewrite")
      .map((s) => ({
        id: s.id,
        text: s.description || s.title,
        source: "rule",
        impact: s.impact,
      })),
  ];

  return (
    <div className="card space-y-4 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 group"
        >
          <span className="text-gray-500 group-hover:text-brand-400 transition-colors text-xs">
            {expanded ? "▾" : "▸"}
          </span>
          <h2 className="text-sm font-bold text-white">✨ Prompt Optimization</h2>
        </button>

        <div className="flex items-center gap-3">
          {/* Score pill */}
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
                style={{ width: `${promptScore}%` }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{promptScore}</span>
            <span className="text-[10px] text-gray-600">/100</span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {/* ── Optimized prompt ─────────────────────────────── */}
          {optimizedPrompt && (
            <div className="rounded-lg border border-brand-800/40 bg-brand-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider">
                  Optimized Prompt
                </p>
                <button
                  onClick={handleCopy}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all duration-200
                    ${copied
                      ? "border-emerald-600/50 bg-emerald-900/30 text-emerald-400"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-200 font-mono leading-relaxed whitespace-pre-wrap">
                {optimizedPrompt}
              </p>
            </div>
          )}

          {/* ── Improvements list ────────────────────────────── */}
          {allImprovements.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Improvements Applied
              </p>
              <ul className="space-y-1.5">
                {allImprovements.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-800/50"
                  >
                    <span className={`mt-0.5 text-xs ${
                      item.source === "ai" ? "text-brand-400" : "text-amber-400"
                    }`}>
                      {item.source === "ai" ? "◆" : "▪"}
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All good message */}
          {!optimizedPrompt && allImprovements.length === 0 && (
            <p className="text-sm text-emerald-400 py-2">
              ✓ Your prompt follows all best practices — no changes needed.
            </p>
          )}
        </>
      )}
    </div>
  );
}
