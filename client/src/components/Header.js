import React from "react";

export default function Header() {
  return (
    <header className="border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-brand-500/20">
            AI
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Benchmark Dashboard
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5 hidden sm:block">
              Prompt Analysis · Cost · Energy · Quality
            </p>
          </div>
        </div>

        {/* Right: status */}
        <div className="flex items-center gap-3">
          <span className="badge bg-brand-900/40 text-brand-300 ring-1 ring-brand-700/40 text-[10px]">
            v1.0
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-[10px] text-gray-600 hidden sm:inline">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}
