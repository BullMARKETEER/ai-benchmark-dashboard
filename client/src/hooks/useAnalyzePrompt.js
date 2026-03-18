import { useState, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

/**
 * Normalise the server's /analyze-prompt response into the shape
 * the UI components expect.
 *
 * Server returns:
 *   { tokens, models[], comparison, optimizedPrompt, improvements[] }
 *
 * UI expects:
 *   { prompt, models[], summary, optimizations, durationMs }
 */
function normaliseResponse(data, originalPrompt) {
  const models = (data.models || []).map((m) => ({
    modelId:   m.name,
    latencyMs: m.latency,
    simulated: m.simulated ?? false,
    output:    m.output    ?? "",
    tokens: {
      input:  m.inputTokens,
      output: m.outputTokens,
      total:  m.inputTokens + m.outputTokens,
    },
    cost: {
      totalCost:  m.cost,
      inputCost:  0,
      outputCost: 0,
      currency:   "USD",
    },
    energy: {
      energyWh:    m.energy,
      carbonGrams: +(m.energy * 0.475).toFixed(6),
    },
    quality: {
      overallScore: m.qualityScore,
      scores:       null,
      summary:      "",
      method:       "llm-judge",
    },
  }));

  /* Use server-side comparison when available, else compute locally */
  const cmp = data.comparison || {};
  const sorted = {
    byCost:    [...models].sort((a, b) => a.cost.totalCost - b.cost.totalCost),
    byLatency: [...models].sort((a, b) => a.latencyMs - b.latencyMs),
    byQuality: [...models].sort((a, b) => b.quality.overallScore - a.quality.overallScore),
    byCarbon:  [...models].sort((a, b) => a.energy.carbonGrams - b.energy.carbonGrams),
  };

  const improvements = data.improvements || [];
  const noChanges    = improvements.length === 1 && improvements[0].toLowerCase().includes("no changes");
  const promptScore  = noChanges ? 100 : Math.max(0, 100 - improvements.length * 15);

  return {
    id:        crypto.randomUUID?.() ?? Date.now().toString(),
    timestamp: new Date().toISOString(),
    durationMs: models.reduce((max, m) => Math.max(max, m.latencyMs), 0),
    prompt: {
      text:       originalPrompt,
      totalTokens: data.tokens,
      wordCount:  originalPrompt.trim().split(/\s+/).filter(Boolean).length,
      charCount:  originalPrompt.length,
    },
    models,
    optimizations: {
      optimizedPrompt: data.optimizedPrompt,
      improvements,
      promptScore,
      suggestions: improvements.map((text, i) => ({
        id:          `imp-${i}`,
        title:       text.split("—")[0] || text.slice(0, 50),
        description: text,
        impact:      i === 0 ? "high" : "medium",
      })),
      totalChecks: improvements.length || 1,
      passed:      noChanges ? 1 : 0,
    },
    summary: {
      cheapestModel:       cmp.cheapest       || sorted.byCost[0]?.modelId,
      fastestModel:        cmp.fastest        || sorted.byLatency[0]?.modelId,
      highestQualityModel: cmp.highestQuality || sorted.byQuality[0]?.modelId,
      lowestCarbonModel:   cmp.lowestEnergy   || sorted.byCarbon[0]?.modelId,
      mostEfficient:       cmp.mostEfficient  || null,
      totalModelsCompared: models.length,
    },
  };
}

export function useAnalyzePrompt() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const analyze = useCallback(async (prompt, models = []) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze-prompt`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt, models }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      const data       = await res.json();
      const normalised = normaliseResponse(data, prompt);
      setResult(normalised);
      return normalised;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { analyze, result, loading, error, clear };
}

