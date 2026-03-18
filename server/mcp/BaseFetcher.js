"use strict";

/**
 * mcp/BaseFetcher.js
 *
 * Generic base class for MCP-style data fetchers with:
 *   - In-memory cache with configurable TTL
 *   - Auto-refresh scheduler (setInterval)
 *   - Static fallback on fetch failure
 *   - Structured logging
 *   - Listener hooks for updates
 *
 * Subclass contract:
 *   1. Override `_fetchExternal()`  → Promise<Data>   (the live fetch)
 *   2. Pass `staticFallback`       → Data             (never-fail default)
 *   3. Optionally override `name`  → string           (log prefix)
 *
 * Public API inherited by every fetcher:
 *   getData()            → Promise<Data>
 *   invalidateCache()    → void
 *   getCacheStatus()     → { cached, ageMs, expiresInMs, source }
 *   startScheduler(ms?)  → void       (auto-refresh on interval)
 *   stopScheduler()      → void
 *   onUpdate(fn)         → unsubscribe function
 *
 * @example
 *   class PricingFetcher extends BaseFetcher {
 *     constructor() { super("pricing", STATIC, 3600000); }
 *     async _fetchExternal() { return simulatedData; }
 *   }
 */

class BaseFetcher {
  /**
   * @param {string}  name            Human-readable name for logs (e.g. "pricing")
   * @param {*}       staticFallback  Hardcoded fallback data (must never throw)
   * @param {number}  [cacheTtlMs]    Cache TTL in ms, default 1 hour
   */
  constructor(name, staticFallback, cacheTtlMs = 60 * 60 * 1000) {
    this.name           = name;
    this.staticFallback = staticFallback;
    this.cacheTtlMs     = cacheTtlMs;

    /** @type {{ data: *, fetchedAt: number, source: string } | null} */
    this._cache         = null;
    this._intervalId    = null;
    this._listeners     = [];
    this._refreshCount  = 0;
  }

  /* ── To be overridden ──────────────────────────────────── */

  /**
   * Fetch fresh data from the external source.
   * MUST be overridden by subclass.
   * @returns {Promise<*>}
   */
  async _fetchExternal() {
    throw new Error(`${this.name}: _fetchExternal() not implemented`);
  }

  /* ── Cache helpers ─────────────────────────────────────── */

  _isCacheValid() {
    return this._cache !== null && Date.now() - this._cache.fetchedAt < this.cacheTtlMs;
  }

  _setCache(data, source) {
    this._cache = { data, fetchedAt: Date.now(), source };
  }

  _log(msg) {
    const ts = new Date().toISOString();
    console.log(`[${this.name}] ${ts}  ${msg}`);
  }

  _warn(msg) {
    const ts = new Date().toISOString();
    console.warn(`[${this.name}] ${ts}  ${msg}`);
  }

  /* ── Public API ────────────────────────────────────────── */

  /**
   * Get data, serving from cache when fresh.
   * Falls back to static data on any error.
   * @returns {Promise<*>}
   */
  async getData() {
    if (this._isCacheValid()) return this._cache.data;

    try {
      const fresh = await this._fetchExternal();
      this._setCache(fresh, "external");
      this._refreshCount++;
      this._log(`Refreshed from external source (refresh #${this._refreshCount})`);
      this._notify(fresh, "external");
      return fresh;
    } catch (err) {
      this._warn(`External fetch failed (${err.message}). Using static fallback.`);
      this._setCache(this.staticFallback, "static-fallback");
      return this.staticFallback;
    }
  }

  /**
   * Force the next getData() to re-fetch regardless of TTL.
   */
  invalidateCache() {
    this._cache = null;
    this._log("Cache invalidated");
  }

  /**
   * Inspect cache state — useful for /api/health or admin endpoints.
   * @returns {{ cached: boolean, ageMs: number|null, expiresInMs: number|null, source: string|null, refreshCount: number }}
   */
  getCacheStatus() {
    if (!this._cache) {
      return { cached: false, ageMs: null, expiresInMs: null, source: null, refreshCount: this._refreshCount };
    }
    const ageMs      = Date.now() - this._cache.fetchedAt;
    const expiresInMs = Math.max(0, this.cacheTtlMs - ageMs);
    return { cached: true, ageMs, expiresInMs, source: this._cache.source, refreshCount: this._refreshCount };
  }

  /* ── Scheduler ─────────────────────────────────────────── */

  /**
   * Start an auto-refresh interval.
   * Defaults to `cacheTtlMs` so data is always warm when callers request it.
   *
   * @param {number} [intervalMs]  Override interval; defaults to this.cacheTtlMs
   */
  startScheduler(intervalMs) {
    if (this._intervalId) {
      this._log("Scheduler already running — skipping duplicate start");
      return;
    }

    const ms = intervalMs ?? this.cacheTtlMs;
    this._log(`Scheduler started (interval: ${(ms / 1000).toFixed(0)}s)`);

    // Immediate first fetch to warm cache on startup
    this.getData().catch(() => {});

    this._intervalId = setInterval(async () => {
      this.invalidateCache();          // force fresh fetch
      await this.getData();            // will log + notify
    }, ms);

    // Allow Node to exit even with the interval running
    if (this._intervalId.unref) this._intervalId.unref();
  }

  /**
   * Stop the auto-refresh scheduler.
   */
  stopScheduler() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._log("Scheduler stopped");
    }
  }

  /**
   * Whether the scheduler is currently running.
   * @returns {boolean}
   */
  isSchedulerRunning() {
    return this._intervalId !== null;
  }

  /* ── Listener / observer pattern ───────────────────────── */

  /**
   * Subscribe to data updates. The callback receives (newData, source).
   * Returns an unsubscribe function.
   *
   * @param {(data: *, source: string) => void} fn
   * @returns {() => void} unsubscribe
   */
  onUpdate(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  /** @private */
  _notify(data, source) {
    for (const fn of this._listeners) {
      try { fn(data, source); } catch { /* listener errors must not break the fetcher */ }
    }
  }
}

module.exports = BaseFetcher;
