import React, { useState } from "react";
import Header from "./components/Header";
import PromptInput from "./components/PromptInput";
import ResultsDashboard from "./pages/ResultsDashboard";
import { useAnalyzePrompt } from "./hooks/useAnalyzePrompt";

export default function App() {
  const { analyze, result, loading, error, clear } = useAnalyzePrompt();
  const [history, setHistory] = useState([]);

  const handleAnalyze = async (prompt, models) => {
    const data = await analyze(prompt, models);
    if (data) {
      setHistory((prev) => [data, ...prev].slice(0, 10)); // keep last 10
    }
  };

  const handleSelectHistory = (entry) => {
    // Re-set the result to a previous run
    analyze._setResult?.(entry);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Prompt input */}
        <PromptInput onAnalyze={handleAnalyze} loading={loading} />

        {/* Error alert */}
        {error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/30 px-5 py-4 flex items-start gap-3 animate-fade-in">
            <span className="text-red-400 text-lg">⚠</span>
            <div>
              <p className="text-sm font-medium text-red-300">Analysis Failed</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
            <button
              onClick={clear}
              className="ml-auto text-xs text-red-500 hover:text-red-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !result && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-800/40 bg-gray-900/40 p-4 h-24" />
              ))}
            </div>
            <div className="rounded-xl border border-gray-800/40 bg-gray-900/40 h-64" />
          </div>
        )}

        {/* Results */}
        {result && <ResultsDashboard result={result} />}

        {/* Previous analyses */}
        {history.length > 1 && (
          <section className="animate-fade-in">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Previous Analyses
            </h2>
            <div className="space-y-2">
              {history.slice(1).map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelectHistory(r)}
                  className="w-full text-left rounded-xl border border-gray-800/40 bg-gray-900/30 px-4 py-3
                             hover:border-brand-700/40 hover:bg-gray-900/50 transition-all group"
                >
                  <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                    {r.prompt.text}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1 flex gap-2">
                    <span>{r.models.length} models</span>
                    <span>·</span>
                    <span>{r.durationMs}ms</span>
                    <span>·</span>
                    <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-4 text-center text-[11px] text-gray-600">
        AI Benchmark Dashboard · React + Tailwind + Express · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
