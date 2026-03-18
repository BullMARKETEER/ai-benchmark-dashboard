import React, { useState } from "react";
import MetricCard from "../components/MetricCard";
import ModelComparisonTable from "../components/ModelComparisonTable";
import CostQualityChart from "../components/CostQualityChart";
import EnergyTokensChart from "../components/EnergyTokensChart";
import OptimizationPanel from "../components/OptimizationPanel";

/**
 * ResultsDashboard — renders after a successful /analyze-prompt call.
 *
 * Sections:
 *   1. Metric cards row (Tokens, Cost, Energy, Latency) with (i) tooltips
 *   2. Winner badges
 *   3. Model Comparison Table (sortable)
 *   4. Optimized Prompt section
 *
 * Props:
 *   result – normalised response from useAnalyzePrompt hook
 */
export default function ResultsDashboard({ result }) {
  if (!result) return null;

  const { prompt, models, summary, optimizations, durationMs } = result;
  const [activeModel, setActiveModel] = useState(null);

  /* ── Aggregate metrics ─────────────────────────────────── */
  const inputTokens  = prompt.totalTokens;                                         // server-side count for the prompt alone
  const avgOutputTok = Math.round(models.reduce((s, m) => s + m.tokens.output, 0) / models.length);
  const avgCost      = models.reduce((s, m) => s + m.cost.totalCost, 0) / models.length;
  const avgEnergy    = models.reduce((s, m) => s + m.energy.energyWh, 0) / models.length;
  const avgLatency   = Math.round(models.reduce((s, m) => s + m.latencyMs, 0) / models.length);
  const avgQuality   = (models.reduce((s, m) => s + m.quality.overallScore, 0) / models.length).toFixed(1);

  /* ── Tooltip definitions ───────────────────────────────── */
  const TOOLTIPS = {
    tokens:
      "The number of input tokens in your prompt. Tokens are sub-word units (roughly ¾ of a word). Each model also produces output tokens — see the comparison table for per-model breakdowns.",
    cost:
      "Average cost per model in USD, based on each model's per-token pricing for input and output tokens.",
    energy:
      "Estimated energy consumption in watt-hours (Wh). This accounts for model size, token count, and hardware efficiency. Smaller models typically use less energy.",
    latency:
      "The time in milliseconds between sending the prompt and receiving the full response. Lower latency means faster responses.",
  };

  /* ── Expanded output for a model ───────────────────────── */
  const expandedModel = activeModel
    ? models.find((m) => m.modelId === activeModel)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Metric cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tokens"
          value={inputTokens.toLocaleString()}
          subtitle={`~${avgOutputTok} avg output tokens`}
          icon="🔤"
          color="brand"
          tooltip={TOOLTIPS.tokens}
        />
        <MetricCard
          title="Cost"
          value={`$${avgCost.toFixed(5)}`}
          subtitle={`Avg per model (${models.length} model${models.length > 1 ? "s" : ""})`}
          icon="💰"
          color="amber"
          tooltip={TOOLTIPS.cost}
        />
        <MetricCard
          title="Energy"
          value={`${avgEnergy.toFixed(5)} Wh`}
          subtitle={`≈ ${(avgEnergy * 0.475).toFixed(5)} gCO₂`}
          icon="⚡"
          color="emerald"
          tooltip={TOOLTIPS.energy}
        />
        <MetricCard
          title="Latency"
          value={`${avgLatency} ms`}
          subtitle={`Avg across ${models.length} models`}
          icon="⏱"
          color="cyan"
          tooltip={TOOLTIPS.latency}
        />
      </div>

      {/* ── 2. Winner badges ─────────────────────────────── */}
      <div className="flex flex-wrap gap-2 text-xs">
        <WinnerBadge label="Cheapest"     value={summary.cheapestModel}       emoji="💸" cls="bg-emerald-950/50 text-emerald-300 ring-emerald-800/50" />
        <WinnerBadge label="Fastest"      value={summary.fastestModel}        emoji="⚡" cls="bg-cyan-950/50 text-cyan-300 ring-cyan-800/50" />
        <WinnerBadge label="Best Quality" value={summary.highestQualityModel} emoji="🏆" cls="bg-amber-950/50 text-amber-300 ring-amber-800/50" />
        <WinnerBadge label="Greenest"     value={summary.lowestCarbonModel}   emoji="🌱" cls="bg-green-950/50 text-green-300 ring-green-800/50" />
        <span className="badge bg-gray-800/60 text-gray-400 ring-1 ring-gray-700/50 gap-1">
          ⏱ {durationMs}ms total
        </span>
        <span className="badge bg-gray-800/60 text-gray-400 ring-1 ring-gray-700/50 gap-1">
          ⭐ {avgQuality}/10 avg quality
        </span>
      </div>

      {/* ── 3. Model Comparison Table ────────────────────── */}
      <ModelComparisonTable
        models={models}
        comparison={{
          fastest:        summary.fastestModel,
          cheapest:       summary.cheapestModel,
          highestQuality: summary.highestQualityModel,
          lowestEnergy:   summary.lowestCarbonModel,
        }}
      />

      {/* ── Charts ──────────────────────────────────────── */}
      {models.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CostQualityChart models={models} />
          <EnergyTokensChart models={models} />
        </div>
      )}

      {/* ── Model output viewer ──────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Model Outputs</h2>
          <span className="text-[11px] text-gray-500">Click a model to view its response</span>
        </div>

        {/* Model tabs */}
        <div className="flex overflow-x-auto border-b border-gray-800/50 bg-gray-900/40">
          {models.map((m) => (
            <button
              key={m.modelId}
              onClick={() => setActiveModel(activeModel === m.modelId ? null : m.modelId)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeModel === m.modelId
                  ? "border-brand-500 text-brand-400 bg-brand-950/20"
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"}`}
            >
              {m.modelId}
              {m.simulated && (
                <span className="ml-1.5 text-[10px] text-gray-600">(sim)</span>
              )}
            </button>
          ))}
        </div>

        {/* Output area */}
        {expandedModel ? (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
              <span>{expandedModel.latencyMs}ms</span>
              <span>·</span>
              <span>{expandedModel.tokens.total} tokens</span>
              <span>·</span>
              <span>${expandedModel.cost.totalCost.toFixed(5)}</span>
              <span>·</span>
              <span className={
                expandedModel.quality.overallScore >= 8 ? "text-emerald-400" :
                expandedModel.quality.overallScore >= 6 ? "text-amber-400"   : "text-red-400"
              }>
                {expandedModel.quality.overallScore}/10
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-gray-800/40 border border-gray-800/50 text-sm text-gray-300 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {expandedModel.output || "(no output)"}
            </pre>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-600">
            Select a model tab above to view its response
          </div>
        )}
      </div>

      {/* ── 4. Optimization section ──────────────────────── */}
      <OptimizationPanel optimizations={optimizations} />
    </div>
  );
}

/* ── Small helper ──────────────────────────────────────────── */
function WinnerBadge({ label, value, emoji, cls }) {
  if (!value) return null;
  return (
    <span className={`badge ring-1 gap-1.5 px-3 py-1 ${cls}`}>
      <span>{emoji}</span>
      <span className="opacity-70">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
