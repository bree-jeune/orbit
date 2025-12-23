/**
 * Orbit Configuration Constants
 *
 * Central location for all magic numbers and configuration values.
 * Organized by domain for easy tuning and maintenance.
 */

// =============================================================================
// SCORING WEIGHTS
// =============================================================================

export const SCORING_WEIGHTS = {
  TIME: 0.20,      // Hour-of-day pattern matching
  PLACE: 0.15,     // Location context (home/work)
  DEVICE: 0.10,    // Device type matching
  RECENCY: 0.25,   // How recently accessed
  FREQUENCY: 0.15, // How often accessed
  PINNED: 0.10,    // User pinned items
  NOVELTY: 0.05,   // Boost for new items
};

// Validate weights sum to 1.0
const weightSum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  console.warn(`Scoring weights sum to ${weightSum}, expected 1.0`);
}

// =============================================================================
// ITEM DEFAULTS
// =============================================================================

export const ITEM_DEFAULTS = {
  MAX_VISIBLE: 5,           // Maximum items shown in orbit
  DECAY_DAYS: 7,            // Days until item fully decays
  QUIET_HOURS_DEFAULT: 4,   // Default quiet period in hours
  NOVELTY_HOURS: 24,        // Hours an item is considered "new"
};

// =============================================================================
// VISUAL SIZING
// =============================================================================

export const PLANET_SIZES = {
  CENTER: 42,               // Center planet diameter (px)
  DOT_MIN: 16,              // Orbiting dot minimum size (px)
  DOT_MAX: 24,              // Orbiting dot maximum size after growth (px)
  DOT_GROWTH_DAYS: 7,       // Days to reach max size
};

export const ORBIT_RADII = {
  MIN_DISTANCE: 140,        // Closest orbit distance from center (px)
  MAX_DISTANCE: 240,        // Farthest orbit distance from center (px)
  DISTANCE_RANGE: 100,      // Range = MAX - MIN (calculated for convenience)
};

export const DEBRIS_RINGS = {
  APPEAR_AFTER_DAYS: 2,     // Days before rings start appearing
  MAX_SIZE: 50,             // Maximum ring diameter (px)
  MAX_OPACITY: 0.6,         // Maximum ring opacity
  GROWTH_RATE: 8,           // Pixels per day of growth
  OPACITY_RATE: 0.1,        // Opacity increase per day
};

// =============================================================================
// ANIMATION DURATIONS
// =============================================================================

export const ANIMATION = {
  DRIFT_DURATION: 100,      // Orbit rotation duration (seconds)
  PULSE_DURATION: 4,        // Center planet pulse duration (seconds)
  HOVER_TRANSITION: 0.25,   // Hover state transition (seconds)
  TOAST_DURATION: 1500,     // Toast notification display time (ms)
  RECOMPUTE_INTERVAL: 60000, // Auto-recompute interval (ms) - 1 minute
};

// =============================================================================
// AUDIO
// =============================================================================

export const AUDIO = {
  SOUNDS: {
    hover: '/sounds/envato_sfxgen_Dec_23_2025_9_59_33.mp3',
    click: '/sounds/envato_sfxgen_Dec_23_2025_10_01_03.mp3',
    ambient: '/sounds/Space Ambience.mp3',
  },
  VOLUMES: {
    hover: 0.15,
    click: 0.25,
    ambient: 0.1,
  },
  DEBOUNCE_MS: 80,          // Debounce hover sounds
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  ITEMS: 'orbit_items',
  CONTEXT: 'orbit_context',
  MUSIC_PREF: 'orbit_music',
};

// =============================================================================
// COLORS (matching logo)
// =============================================================================

export const COLORS = {
  PRIMARY_LIGHT: '#3b82f6',   // Blue 500
  PRIMARY: '#1e40af',         // Blue 800
  PRIMARY_DARK: '#1e3a8a',    // Blue 900
  ACCENT: '#818cf8',          // Indigo 400
  ACCENT_DARK: '#6366f1',     // Indigo 500
};

// =============================================================================
// ITEM LIFECYCLE STATES
// =============================================================================

export const ITEM_STATES = {
  NEW: 'new',           // Just created, within novelty period
  ACTIVE: 'active',     // Normal state, being scored
  QUIETED: 'quieted',   // Temporarily suppressed
  DECAYING: 'decaying', // Score dropping due to inactivity
  ARCHIVED: 'archived', // Removed from active orbit
};
