"use strict";

/**
 * mcp/mcpScheduler.js
 *
 * Central coordinator for all MCP fetcher schedulers.
 * Call `startAll()` once at server boot to spin up auto-refresh
 * intervals for pricing, benchmarks, and research data.
 *
 * Each fetcher's scheduler runs on its own interval:
 *   - pricingFetcher    →  1 hour
 *   - benchmarkFetcher  →  4 hours
 *   - researchFetcher   →  2 hours
 *
 * Logs are timestamped and prefixed with each fetcher's name
 * (inherited from BaseFetcher).
 *
 * Public API:
 *   startAll()     → void     Start all fetcher schedulers
 *   stopAll()      → void     Stop all fetcher schedulers
 *   getStatus()    → object   Return cache + scheduler status for each fetcher
 */

const { pricingFetcher }   = require("./pricingFetcher");
const { benchmarkFetcher } = require("./benchmarkFetcher");
const { researchFetcher }  = require("./researchFetcher");

const ALL_FETCHERS = [
  { name: "pricing",   fetcher: pricingFetcher   },
  { name: "benchmark", fetcher: benchmarkFetcher },
  { name: "research",  fetcher: researchFetcher  },
];

/**
 * Start auto-refresh schedulers for every registered fetcher.
 * Safe to call multiple times — duplicates are ignored.
 */
function startAll() {
  console.log("[mcpScheduler] Starting all MCP data fetcher schedulers…");

  for (const { fetcher } of ALL_FETCHERS) {
    fetcher.startScheduler();            // uses each fetcher's own cacheTtlMs
  }

  console.log("[mcpScheduler] All schedulers running ✓");
}

/**
 * Gracefully stop every fetcher's scheduler.
 */
function stopAll() {
  for (const { fetcher } of ALL_FETCHERS) {
    fetcher.stopScheduler();
  }
  console.log("[mcpScheduler] All schedulers stopped");
}

/**
 * Return a status object for /api/health or admin dashboards.
 *
 * @returns {{ [name: string]: { scheduler: boolean, cache: object } }}
 */
function getStatus() {
  const status = {};
  for (const { name, fetcher } of ALL_FETCHERS) {
    status[name] = {
      scheduler: fetcher.isSchedulerRunning(),
      cache:     fetcher.getCacheStatus(),
    };
  }
  return status;
}

module.exports = { startAll, stopAll, getStatus };
