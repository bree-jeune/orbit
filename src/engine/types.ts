/**
 * Orbit Engine - Core Types
 *
 * Every item is a body in a gravitational field.
 * Mass = inherent importance
 * Distance = current relevance
 * Velocity = how fast relevance is changing
 */

import { ITEM_DEFAULTS, STORAGE_KEYS } from '../config/constants';

// =============================================================================
// Core Types
// =============================================================================

export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type PlaceType = 'home' | 'work' | 'unknown';
export type InteractionType = 'seen' | 'opened' | 'dismissed';
export type ItemState = 'new' | 'active' | 'quieted' | 'decaying' | 'archived';

export interface OrbitContext {
  now: string;
  hour: number;
  day: number;
  device: DeviceType;
  place: PlaceType;
  sessionId: string;
}

export interface Histogram {
  [key: string]: number;
  [key: number]: number;
}

export interface OrbitItemSignals {
  createdAt: string;
  lastSeenAt: string | null;
  seenCount: number;
  openedCount: number;
  dismissedCount: number;
  hourHistogram: Histogram;
  dayHistogram: Histogram;
  placeHistogram: Histogram;
  deviceHistogram: Histogram;
  ignoredStreak: number;
  isPinned: boolean;
  pinUntil: string | null;
  quietUntil?: string;
}

export interface OrbitItemComputed {
  score: number;
  distance: number;
  reasons: string[];
  updatedAt?: string;
}

export interface OrbitItem {
  id: string;
  title: string;
  detail?: string;
  url?: string;
  signals: OrbitItemSignals;
  computed: OrbitItemComputed;
}

// =============================================================================
// Constants (for backward compatibility)
// =============================================================================

export const DEFAULTS = {
  ...ITEM_DEFAULTS,
  MIN_SCORE: 0,
  MAX_SCORE: 1,
};

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new orbit item
 */
export function createItem(title: string, detail = '', url = ''): OrbitItem {
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
 */
export function getCurrentContext(): OrbitContext {
  const now = new Date();

  // Detect device type
  const ua = navigator.userAgent.toLowerCase();
  let device: DeviceType = 'desktop';
  if (/mobile|android|iphone|ipad/.test(ua)) {
    device = /ipad|tablet/.test(ua) ? 'tablet' : 'mobile';
  }

  // Place defaults to unknown - user can set manually
  const place = (localStorage.getItem(STORAGE_KEYS.CONTEXT) || 'unknown') as PlaceType;

  return {
    now: now.toISOString(),
    hour: now.getHours(),
    day: now.getDay(),
    device,
    place,
    sessionId: sessionStorage.getItem('orbit_session') || createSessionId(),
  };
}

function createSessionId(): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem('orbit_session', id);
  return id;
}
