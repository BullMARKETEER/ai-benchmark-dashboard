import React, { useState } from "react";

/**
 * Sortable table that compares all models side-by-side.
 *
 * Columns: Model, Latency, Tokens, Cost, Energy, Quality
 * Clicking a header sorts by that column.  The "winner" row gets a subtle highlight.
 *
 * Props:
 *   models     – array from normalised API response
 *   comparison – { fastest, cheapest, highestQuality, lowestEnergy } labels
 */

const COLS = [
  { key: "model",   label: "Model",          align: "left"  },
  { key: "latency", label: "Latency",        align: "right" },
  { key: "tokens",  label: "Tokens",         align: "right" },
  { key: "cost",    label: "Cost (USD)",      align: "right" },
  { key: "energy",  label: "Energy (Wh)",     align: "right" },
  { key: "quality", label: "Quality",        align: "right" },
];

function getter(row, key) {
  switch (key) {
    case "model":   return row.modelId;
    case "latency": return row.latencyMs;
    case "tokens":  return row.tokens.total;
    case "cost":    return row.cost.totalCost;
    case "energy":  return row.energy.energyWh;
    case "quality": return row.quality.overallScore;
    default:        return 0;
  }
}

export default function ModelComparisonTable({ models, comparison }) {
  const [sortKey, setSortKey] = useState("quality");
  const [sortAsc, setSortAsc] = useState(false); // quality default: desc (highest first)

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      // "quality" higher = better → default desc; rest lower = better → default asc
      setSortAsc(key !== "quality");
    }
  };

  const sorted = [...models].sort((a, b) => {
    const va = getter(a, sortKey);
    const vb = getter(b, sortKey);
    if (typeof va === "string") return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  /* Helper: badge label if this model is a category winner */
  const badges = (modelId) => {
    if (!comparison) return [];
    const b = [];
    if (comparison.fastest       === modelId) b.push({ emoji: "⚡", label: "Fastest",     cls: "bg-cyan-900/40 text-cyan-300 ring-cyan-700/50" });
    if (comparison.cheapest      === modelId) b.push({ emoji: "💸", label: "Cheapest",    cls: "bg-emerald-900/40 text-emerald-300 ring-emerald-700/50" });
    if (comparison.highestQuality === modelId) b.push({ emoji: "🏆", label: "Best Quality", cls: "bg-amber-900/40 text-amber-300 ring-amber-700/50" });
    if (comparison.lowestEnergy  === modelId) b.push({ emoji: "🌱", label: "Greenest",    cls: "bg-green-900/40 text-green-300 ring-green-700/50" });
    return b;
  };

  /* Quality colour */
  const qColor = (score) =>
    score >= 8 ? "text-emerald-400" :
    score >= 6 ? "text-amber-400"   : "text-red-400";

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Model Comparison</h2>
        <span className="text-[11px] text-gray-500">
          {models.length} model{models.length > 1 ? "s" : ""} · click headers to sort
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800/60">
              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-5 py-3 font-semibold text-[11px] uppercase tracking-wider cursor-pointer select-none transition-colors
                    ${col.align === "right" ? "text-right" : "text-left"}
                    ${sortKey === col.key ? "text-brand-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-brand-500 text-[10px]">{sortAsc ? "▲" : "▼"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {sorted.map((m, i) => {
              const mBadges = badges(m.modelId);
              const isFirst = i === 0;
              return (
                <tr
                  key={m.modelId}
                  className={`transition-colors hover:bg-gray-800/30 ${isFirst ? "bg-brand-950/20" : ""}`}
                >
                  {/* Model name + badges */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-[13px]">{m.modelId}</span>
                      {m.simulated && (
                        <span className="badge bg-gray-800 text-gray-500 ring-1 ring-gray-700 text-[10px]">
                          sim
                        </span>
                      )}
                      {mBadges.map((b) => (
                        <span
                          key={b.label}
                          className={`badge ring-1 text-[10px] gap-0.5 ${b.cls}`}
                        >
                          <span>{b.emoji}</span>{b.label}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Latency */}
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">
                    {m.latencyMs.toLocaleString()}<span className="text-gray-600 ml-0.5">ms</span>
                  </td>

                  {/* Tokens */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="tabular-nums text-gray-300">{m.tokens.total.toLocaleString()}</span>
                    <span className="block text-[10px] text-gray-600">
                      {m.tokens.input} in · {m.tokens.output} out
                    </span>
                  </td>

                  {/* Cost */}
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">
                    ${m.cost.totalCost.toFixed(5)}
                  </td>

                  {/* Energy */}
                  <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">
                    {m.energy.energyWh.toFixed(5)}
                  </td>

                  {/* Quality */}
                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-bold tabular-nums ${qColor(m.quality.overallScore)}`}>
                      {m.quality.overallScore}
                    </span>
                    <span className="text-gray-600">/10</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
