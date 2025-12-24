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
} as const;

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
    // Core SFX
    newItem: '/sounds/17640 futuristic prompt-full.mp3',     // When submitting new item
    modeSwitch: '/sounds/Futuristic Reveal.wav',             // When switching modes
    markDone: '/sounds/Futuristic Feature Select.mp3',       // When marking item done
    reminder: '/sounds/Futuristic Power Generation.wav',     // Reminder for old items
    // Background
    ambient: '/sounds/Space Ambience.mp3',
  },
  VOLUMES: {
    newItem: 0.3,
    modeSwitch: 0.25,
    markDone: 0.3,
    reminder: 0.2,
    ambient: 0.08,
  },
  DEBOUNCE_MS: 80,
  REMINDER_INTERVAL_MS: 3 * 60 * 60 * 1000, // 3 hours between reminders
  REMINDER_AGE_HOURS: 4,                     // Items older than 4 hours trigger reminders
  // 8D/Immersive audio settings
  IMMERSIVE: {
    PAN_SPEED: 0.0005,        // How fast the sound moves around
    PAN_RANGE: 0.8,           // -0.8 to 0.8 stereo panning
    FILTER_FREQ: 800,         // Low-pass filter frequency
    FILTER_Q: 1.5,            // Filter resonance
  },
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  ITEMS: 'orbit_items',
  CONTEXT: 'orbit_context',
  MUSIC_PREF: 'orbit_music',
  MODES: 'orbit_modes',
  CURRENT_MODE: 'orbit_current_mode',
  FIRST_RUN: 'orbit_first_run',
  LAST_REMINDER: 'orbit_last_reminder',
};

// =============================================================================
// COLORS (matching logo)
// =============================================================================

export const COLORS = {
  // Center planet - Deep Blue
  PRIMARY_LIGHT: '#3b82f6',   // Blue 500
  PRIMARY: '#1e40af',         // Blue 800
  PRIMARY_DARK: '#1e3a8a',    // Blue 900
  // Orbiting planets - Bioluminescent Teal/Cyan
  ORBIT_LIGHT: '#4dd0e1',     // Cyan 300
  ORBIT: '#00e5ff',           // Cyan A400
  // Pinned items - Soft Starlight Gold
  PINNED_LIGHT: '#ffe082',    // Amber 200
  PINNED: '#ffd54f',          // Amber 300
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
