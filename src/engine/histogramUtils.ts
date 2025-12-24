/**
 * Histogram Utilities
 *
 * Provides compression and rolling window for histograms to prevent
 * unbounded growth while maintaining useful pattern information.
 */

// =============================================================================
// Types
// =============================================================================

export interface Histogram {
  [key: string]: number;
  [key: number]: number;
}

export interface CompressedHistogram {
  values: Histogram;
  total: number;
  lastUpdated: string;
  windowDays: number;
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_WINDOW_DAYS = 30;
const DECAY_FACTOR = 0.95; // 5% decay per day for EMA

// =============================================================================
// Histogram Operations
// =============================================================================

/**
 * Add an observation to a histogram
 */
export function addToHistogram(
  histogram: Histogram,
  key: string | number,
  amount = 1
): Histogram {
  return {
    ...histogram,
    [key]: (histogram[key] || 0) + amount,
  };
}

/**
 * Get the total count in a histogram
 */
export function getHistogramTotal(histogram: Histogram): number {
  return Object.values(histogram).reduce((sum, val) => sum + val, 0);
}

/**
 * Normalize histogram values to probabilities (0-1)
 */
export function normalizeHistogram(histogram: Histogram): Histogram {
  const total = getHistogramTotal(histogram);
  if (total === 0) return histogram;

  const normalized: Histogram = {};
  for (const [key, value] of Object.entries(histogram)) {
    normalized[key] = value / total;
  }
  return normalized;
}

/**
 * Apply exponential decay to histogram values
 * Used for time-based decay to give more weight to recent observations
 */
export function decayHistogram(
  histogram: Histogram,
  factor = DECAY_FACTOR
): Histogram {
  const decayed: Histogram = {};
  for (const [key, value] of Object.entries(histogram)) {
    const newValue = value * factor;
    // Only keep values above a threshold
    if (newValue >= 0.01) {
      decayed[key] = newValue;
    }
  }
  return decayed;
}

/**
 * Merge two histograms, summing values
 */
export function mergeHistograms(a: Histogram, b: Histogram): Histogram {
  const merged = { ...a };
  for (const [key, value] of Object.entries(b)) {
    merged[key] = (merged[key] || 0) + value;
  }
  return merged;
}

// =============================================================================
// Compression Utilities
// =============================================================================

/**
 * Compress a histogram using exponential moving average
 * This prevents unbounded growth while preserving patterns
 */
export function compressHistogram(
  histogram: Histogram,
  newObservation: string | number | null = null
): Histogram {
  // Apply decay first
  let compressed = decayHistogram(histogram);

  // Add new observation if provided
  if (newObservation !== null) {
    compressed = addToHistogram(compressed, newObservation, 1);
  }

  // Round values to 2 decimal places to save space
  const rounded: Histogram = {};
  for (const [key, value] of Object.entries(compressed)) {
    rounded[key] = Math.round(value * 100) / 100;
  }

  return rounded;
}

/**
 * Create a compressed histogram structure with metadata
 */
export function createCompressedHistogram(
  values: Histogram,
  windowDays = DEFAULT_WINDOW_DAYS
): CompressedHistogram {
  return {
    values,
    total: getHistogramTotal(values),
    lastUpdated: new Date().toISOString(),
    windowDays,
  };
}

/**
 * Apply rolling window by removing old entries
 * Call this periodically (e.g., daily) to prevent unbounded growth
 */
export function applyRollingWindow(
  histogram: CompressedHistogram
): CompressedHistogram {
  const now = new Date();
  const lastUpdated = new Date(histogram.lastUpdated);
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

  // Apply decay based on days since last update
  const decayIterations = Math.floor(daysSinceUpdate);
  let values = histogram.values;

  for (let i = 0; i < decayIterations; i++) {
    values = decayHistogram(values);
  }

  return createCompressedHistogram(values, histogram.windowDays);
}

// =============================================================================
// Pattern Analysis
// =============================================================================

/**
 * Get the peak (most common) key in a histogram
 */
export function getHistogramPeak(histogram: Histogram): string | number | null {
  let maxKey: string | number | null = null;
  let maxValue = 0;

  for (const [key, value] of Object.entries(histogram)) {
    if (value > maxValue) {
      maxValue = value;
      maxKey = key;
    }
  }

  return maxKey;
}

/**
 * Get the top N keys by count
 */
export function getTopKeys(histogram: Histogram, n = 3): Array<{ key: string | number; count: number }> {
  return Object.entries(histogram)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Calculate affinity score for a given key
 * Returns a value between 0 and 1
 */
export function calculateAffinity(histogram: Histogram, key: string | number): number {
  const count = histogram[key] || 0;
  const total = getHistogramTotal(histogram);
  return total > 0 ? count / total : 0;
}

// =============================================================================
// Migration Helpers
// =============================================================================

/**
 * Migrate raw histogram to compressed format
 * Use this when upgrading existing items
 */
export function migrateToCompressed(rawHistogram: Histogram): CompressedHistogram {
  // Cap values if they're too large (from old unbounded growth)
  const maxValue = 100;
  const capped: Histogram = {};

  for (const [key, value] of Object.entries(rawHistogram)) {
    capped[key] = Math.min(value, maxValue);
  }

  // Normalize to reasonable scale
  const normalized = normalizeHistogram(capped);

  // Scale to meaningful counts (assume ~100 interactions as baseline)
  const scaled: Histogram = {};
  for (const [key, value] of Object.entries(normalized)) {
    scaled[key] = Math.round(value * 100);
  }

  return createCompressedHistogram(scaled);
}
