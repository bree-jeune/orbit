/**
 * Orbit Engine - Core Types
 *
 * Every item is a body in a gravitational field.
 * Mass = inherent importance
 * Distance = current relevance
 * Velocity = how fast relevance is changing
 */

import { ITEM_DEFAULTS, STORAGE_KEYS } from '../config/constants';

/**
 * @typedef {Object} OrbitContext
 * @property {string} now - ISO timestamp
 * @property {'desktop'|'mobile'|'tablet'} device
 * @property {'home'|'work'|'unknown'} place
 * @property {string} sessionId
 */

/**
 * @typedef {Object} OrbitItemSignals
 * @property {string} createdAt
 * @property {string} [lastSeenAt]
 * @property {number} seenCount
 * @property {number} openedCount
 * @property {number} dismissedCount
 * @property {Object.<number, number>} [hourHistogram] - 0-23 hour buckets
 * @property {Object.<number, number>} [dayHistogram] - 0-6 day buckets
 * @property {Object.<string, number>} [placeHistogram] - place label counts
 * @property {Object.<string, number>} [deviceHistogram] - device type counts
 * @property {number} ignoredStreak
 * @property {boolean} isPinned
 * @property {string} [pinUntil]
 */

/**
 * @typedef {Object} OrbitItem
 * @property {string} id
 * @property {string} title
 * @property {string} [detail]
 * @property {string} [url]
 * @property {OrbitItemSignals} signals
 * @property {Object} [computed]
 * @property {number} [computed.score] - 0 to 1
 * @property {number} [computed.distance] - derived from score
 * @property {string[]} [computed.reasons] - why this score
 */

// Re-export for backward compatibility, add score bounds
export const DEFAULTS = {
  ...ITEM_DEFAULTS,
  MIN_SCORE: 0,
  MAX_SCORE: 1,
};

/**
 * Create a new orbit item
 * @param {string} title
 * @param {string} [detail]
 * @param {string} [url]
 * @returns {OrbitItem}
 */
export function createItem(title, detail = '', url = '') {
  return {
    id: crypto.randomUUID(),
    title,
    detail,
    url,
    signals: {
      createdAt: new Date().toISOString(),
      lastSeenAt: null,
      seenCount: 0,
      openedCount: 0,
      dismissedCount: 0,
      hourHistogram: {},
      dayHistogram: {},
      placeHistogram: {},
      deviceHistogram: {},
      ignoredStreak: 0,
      isPinned: false,
      pinUntil: null,
    },
    computed: {
      score: 0.5,
      distance: 0.5,
      reasons: [],
    },
  };
}

/**
 * Get current context snapshot
 * @returns {OrbitContext}
 */
export function getCurrentContext() {
  const now = new Date();

  // Detect device type
  const ua = navigator.userAgent.toLowerCase();
  let device = 'desktop';
  if (/mobile|android|iphone|ipad/.test(ua)) {
    device = /ipad|tablet/.test(ua) ? 'tablet' : 'mobile';
  }

  // Place defaults to unknown - user can set manually
  const place = localStorage.getItem(STORAGE_KEYS.CONTEXT) || 'unknown';

  return {
    now: now.toISOString(),
    hour: now.getHours(),
    day: now.getDay(),
    device,
    place,
    sessionId: sessionStorage.getItem('orbit_session') || createSessionId(),
  };
}

function createSessionId() {
  const id = crypto.randomUUID();
  sessionStorage.setItem('orbit_session', id);
  return id;
}
