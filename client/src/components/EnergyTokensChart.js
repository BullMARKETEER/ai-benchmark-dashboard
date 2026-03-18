import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

/**
 * Energy vs Tokens grouped bar chart.
 *
 * Each bar group = one model.
 * Left axis:  Energy (Wh)
 * Right bars: Total tokens (secondary scale visualised as normalised bar)
 *
 * Props:
 *   models – normalised models array from the dashboard
 */

const ENERGY_COLOR = "#34d399";  // emerald-400
const TOKEN_COLOR  = "#818cf8";  // brand-400

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-gray-400">
          {p.name}:{" "}
          <span style={{ color: p.color }}>
            {p.dataKey === "energy"
              ? `${p.value.toFixed(5)} Wh`
              : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex justify-center gap-5 pt-1 pb-2">
      {payload.map((entry) => (
        <span key={entry.value} className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

export default function EnergyTokensChart({ models }) {
  const data = models.map((m) => ({
    name:   m.modelId,
    energy: m.energy.energyWh,
    tokens: m.tokens.total,
  }));

  /* Scale tokens to same visual range as energy for dual-bar readability */
  const maxEnergy = Math.max(...data.map((d) => d.energy));
  const maxTokens = Math.max(...data.map((d) => d.tokens));

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-sm font-bold text-white">Energy vs Tokens</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Energy consumption and total token count per model
        </p>
      </div>
      <div className="px-2 py-4" style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 10, right: 25, bottom: 5, left: 10 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              stroke="#374151"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              yAxisId="energy"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              stroke="#374151"
              tickFormatter={(v) => v.toFixed(3)}
              label={{
                value: "Energy (Wh)",
                angle: -90,
                position: "insideLeft",
                offset: 4,
                style: { fill: "#6b7280", fontSize: 11 },
              }}
            />
            <YAxis
              yAxisId="tokens"
              orientation="right"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              stroke="#374151"
              label={{
                value: "Tokens",
                angle: 90,
                position: "insideRight",
                offset: 4,
                style: { fill: "#6b7280", fontSize: 11 },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(75,85,99,0.15)" }} />
            <Legend content={<CustomLegend />} />
            <Bar
              yAxisId="energy"
              dataKey="energy"
              name="Energy (Wh)"
              fill={ENERGY_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={ENERGY_COLOR} fillOpacity={0.8} />
              ))}
            </Bar>
            <Bar
              yAxisId="tokens"
              dataKey="tokens"
              name="Total Tokens"
              fill={TOKEN_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={TOKEN_COLOR} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
