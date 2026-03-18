import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * Reusable tooltip component with an (i) info button trigger.
 *
 * Usage:
 *   <Tooltip text="Tokens are sub-word units used by language models." />
 *
 * Props:
 *   - text     (string)   Tooltip content
 *   - position (string)   "top" | "bottom" | "left" | "right"  — default "top"
 *   - children (node)     Optional: replace the default (i) button with custom trigger
 */
export default function Tooltip({ text, position = "top", children }) {
  const [visible, setVisible] = useState(false);
  const tipRef = useRef(null);
  const triggerRef = useRef(null);

  /* Close on outside click */
  const handleOutside = useCallback((e) => {
    if (
      tipRef.current &&
      !tipRef.current.contains(e.target) &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target)
    ) {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (visible) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [visible, handleOutside]);

  /* Position classes */
  const positionClasses = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  /* Arrow classes */
  const arrowClasses = {
    top:    "top-full left-1/2 -translate-x-1/2 border-t-gray-700",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-700",
    left:   "left-full top-1/2 -translate-y-1/2 border-l-gray-700",
    right:  "right-full top-1/2 -translate-y-1/2 border-r-gray-700",
  };

  const arrowBorder = {
    top:    "border-t-[6px] border-x-[6px] border-x-transparent border-b-0",
    bottom: "border-b-[6px] border-x-[6px] border-x-transparent border-t-0",
    left:   "border-l-[6px] border-y-[6px] border-y-transparent border-r-0",
    right:  "border-r-[6px] border-y-[6px] border-y-transparent border-l-0",
  };

  return (
    <span className="relative inline-flex items-center">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setVisible((v) => !v)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none
                   border border-gray-600 text-gray-400 hover:text-brand-400 hover:border-brand-500
                   transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 cursor-help"
        aria-label="More info"
      >
        {children || "i"}
      </button>

      {/* Popup */}
      {visible && (
        <span
          ref={tipRef}
          role="tooltip"
          className={`absolute z-50 w-56 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 shadow-xl
                      text-xs text-gray-300 leading-relaxed pointer-events-none
                      animate-tooltip-in ${positionClasses[position]}`}
        >
          {text}
          <span
            className={`absolute w-0 h-0 ${arrowClasses[position]} ${arrowBorder[position]}`}
          />
        </span>
      )}
    </span>
  );
}
