import React from "react";
import Tooltip from "./Tooltip";

/**
 * A single metric card that shows a headline value, subtitle,
 * icon, and an optional (i) tooltip for definitions.
 *
 * Props:
 *   title      – "Tokens", "Cost", etc.
 *   value      – formatted display value
 *   subtitle   – secondary text below the value
 *   icon       – emoji or node
 *   tooltip    – string shown in the (i) popover  (optional)
 *   color      – theme key: brand | emerald | amber | red | purple | cyan
 */
export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tooltip,
  color = "brand",
}) {
  const bg = {
    brand:   "from-brand-500/10 to-brand-600/5  border-brand-800/40",
    emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-800/40",
    amber:   "from-amber-500/10 to-amber-600/5  border-amber-800/40",
    red:     "from-red-500/10 to-red-600/5      border-red-800/40",
    purple:  "from-purple-500/10 to-purple-600/5 border-purple-800/40",
    cyan:    "from-cyan-500/10 to-cyan-600/5    border-cyan-800/40",
  };

  const text = {
    brand:   "text-brand-400",
    emerald: "text-emerald-400",
    amber:   "text-amber-400",
    red:     "text-red-400",
    purple:  "text-purple-400",
    cyan:    "text-cyan-400",
  };

  return (
    <div
      className={`relative rounded-xl border bg-gradient-to-br p-4 transition-shadow
                  hover:shadow-lg hover:shadow-black/20 ${bg[color]}`}
    >
      {/* header: title + tooltip + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          {tooltip && <Tooltip text={tooltip} position="top" />}
        </div>
        {icon && <span className="text-xl opacity-50 select-none">{icon}</span>}
      </div>

      {/* value */}
      <p className={`text-2xl font-bold mt-2 tracking-tight ${text[color]}`}>{value}</p>

      {/* subtitle */}
      {subtitle && (
        <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
