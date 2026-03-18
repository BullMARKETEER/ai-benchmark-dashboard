import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";

/**
 * Cost vs Quality scatter chart.
 *
 * X-axis: Cost (USD)
 * Y-axis: Quality (1–10)
 * Each dot = one model.  Ideal = top-left (high quality, low cost).
 *
 * Props:
 *   models – normalised models array from the dashboard
 */

const DOT_COLORS = [
  "#818cf8", // brand-400 / indigo
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#22d3ee", // cyan-400
  "#a78bfa", // violet-400
  "#fb923c", // orange-400
  "#2dd4bf", // teal-400
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-white">{d.name}</p>
      <p className="text-gray-400">
        Cost: <span className="text-amber-300">${d.cost.toFixed(5)}</span>
      </p>
      <p className="text-gray-400">
        Quality: <span className="text-emerald-300">{d.quality}/10</span>
      </p>
    </div>
  );
}

export default function CostQualityChart({ models }) {
  const data = models.map((m) => ({
    name:    m.modelId,
    cost:    m.cost.totalCost,
    quality: m.quality.overallScore,
  }));

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-sm font-bold text-white">Cost vs Quality</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Ideal: top-left (high quality, low cost)
        </p>
      </div>
      <div className="px-2 py-4" style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 25, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              type="number"
              dataKey="cost"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v) => `$${v.toFixed(4)}`}
              stroke="#374151"
            >
              <Label
                value="Cost (USD)"
                position="insideBottom"
                offset={-12}
                style={{ fill: "#6b7280", fontSize: 11 }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="quality"
              domain={[0, 10]}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              stroke="#374151"
            >
              <Label
                value="Quality"
                angle={-90}
                position="insideLeft"
                offset={4}
                style={{ fill: "#6b7280", fontSize: 11 }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#4b5563" }} />
            <Scatter data={data} fill="#818cf8">
              {data.map((_, i) => (
                <Cell key={i} fill={DOT_COLORS[i % DOT_COLORS.length]} r={7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="px-5 pb-3 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
            />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
