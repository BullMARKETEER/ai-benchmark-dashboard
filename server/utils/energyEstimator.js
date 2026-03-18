/**
 * Energy estimation module.
 * Approximates energy consumption & CO₂ based on tokens × model-specific factors.
 *
 * Factors are rough estimates combining:
 *   - GPU TDP (e.g., H100 ~700 W)
 *   - Tokens-per-second throughput
 *   - Data-center PUE (~1.1)
 *   - Grid carbon intensity (global avg ~475 gCO₂/kWh)
 */

// Watt-hours per 1 000 tokens (inference only)
const ENERGY_FACTORS = {
  "gpt-4o":          { whPer1kTokens: 0.045, gpuType: "H100" },
  "gpt-4o-mini":     { whPer1kTokens: 0.018, gpuType: "H100" },
  "gpt-4-turbo":     { whPer1kTokens: 0.060, gpuType: "A100" },
  "gpt-3.5-turbo":   { whPer1kTokens: 0.012, gpuType: "A100" },
  "claude-3-opus":   { whPer1kTokens: 0.070, gpuType: "TPUv5" },
  "claude-3.5-sonnet": { whPer1kTokens: 0.035, gpuType: "TPUv5" },
  "gemini-1.5-pro":  { whPer1kTokens: 0.040, gpuType: "TPUv5" },
  "llama-3-70b":     { whPer1kTokens: 0.050, gpuType: "A100" },
};

const PUE = 1.1; // Power Usage Effectiveness
const CARBON_INTENSITY_G_PER_KWH = 475; // global average gCO₂eq/kWh

/**
 * Estimate energy usage and carbon footprint.
 * @param {string} modelId
 * @param {number} totalTokens  (input + output)
 * @returns {{ energyWh: number, energyKwh: number, carbonGrams: number, gpuType: string }}
 */
function estimateEnergy(modelId, totalTokens) {
  const factor = ENERGY_FACTORS[modelId] || { whPer1kTokens: 0.04, gpuType: "Unknown" };
  const rawWh = (totalTokens / 1000) * factor.whPer1kTokens;
  const energyWh = +(rawWh * PUE).toFixed(6);
  const energyKwh = +(energyWh / 1000).toFixed(9);
  const carbonGrams = +(energyKwh * CARBON_INTENSITY_G_PER_KWH).toFixed(6);

  return {
    energyWh,
    energyKwh,
    carbonGrams,
    gpuType: factor.gpuType,
    pue: PUE,
    gridCarbonIntensity: CARBON_INTENSITY_G_PER_KWH,
  };
}

module.exports = { estimateEnergy, ENERGY_FACTORS };
