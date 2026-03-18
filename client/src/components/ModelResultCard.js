import React, { useState } from "react";

export default function ModelResultCard({ model }) {
  const [expanded, setExpanded] = useState(false);

  const qualityColor =
    model.quality.overallScore >= 7 ? "text-emerald-400" :
    model.quality.overallScore >= 5 ? "text-amber-400" : "text-red-400";

  return (
    <div className="card space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white">{model.modelId}</h3>
          {model.simulated && (
            <span className="badge bg-gray-800 text-gray-400 ring-1 ring-gray-700">simulated</span>
          )}
        </div>
        <span className="text-xs text-gray-500">{model.latencyMs}ms</span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Tokens" value={model.tokens.total.toLocaleString()} sub={`${model.tokens.input} in / ${model.tokens.output} out`} />
        <Metric label="Cost" value={`$${model.cost.totalCost.toFixed(4)}`} sub={model.cost.currency} />
        <Metric label="Energy" value={`${model.energy.energyWh.toFixed(4)} Wh`} sub={`${model.energy.carbonGrams.toFixed(4)} gCO₂`} />
        <Metric label="Quality" value={<span className={qualityColor}>{model.quality.overallScore}/10</span>} sub={model.quality.method} />
      </div>

      {/* Quality scores breakdown */}
      {model.quality.scores && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(model.quality.scores).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 capitalize">{key}</span>
              <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(val / 10) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-400">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expandable output */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          {expanded ? "▾ Hide output" : "▸ Show output"}
        </button>
        {expanded && (
          <pre className="mt-2 p-3 rounded-lg bg-gray-800/60 text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
            {model.output}
          </pre>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-200 mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </div>
  );
}
