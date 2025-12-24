/**
 * Item Lifecycle State Machine
 *
 * Manages explicit states for items instead of scattered boolean flags.
 * States: new → active → quieted → decaying → archived
 */

import { ITEM_DEFAULTS } from '../config/constants';

// =============================================================================
// State Types
// =============================================================================

export type ItemState = 'new' | 'active' | 'quieted' | 'decaying' | 'archived';

export interface StateContext {
  now: Date;
  createdAt: Date;
  lastSeenAt: Date | null;
  quietUntil: Date | null;
  ignoredStreak: number;
  isRemoved: boolean;
}

export interface StateTransition {
  from: ItemState;
  to: ItemState;
  reason: string;
}

// =============================================================================
// State Machine Configuration
// =============================================================================

const NOVELTY_HOURS = ITEM_DEFAULTS.NOVELTY_HOURS || 24;
const DECAY_THRESHOLD_DAYS = 7;
const IGNORED_STREAK_THRESHOLD = 5;

// =============================================================================
// State Computation
// =============================================================================

/**
 * Compute the current state of an item based on its context
 */
export function computeState(ctx: StateContext): ItemState {
  const { now, createdAt, lastSeenAt, quietUntil, ignoredStreak, isRemoved } = ctx;

  // Archived - item has been removed
  if (isRemoved) {
    return 'archived';
  }

  // Quieted - temporarily suppressed
  if (quietUntil && quietUntil > now) {
    return 'quieted';
  }

  // New - within novelty period
  const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  if (ageHours < NOVELTY_HOURS) {
    return 'new';
  }

  // Decaying - ignored for too long or not seen recently
  if (ignoredStreak >= IGNORED_STREAK_THRESHOLD) {
    return 'decaying';
  }

  if (lastSeenAt) {
    const daysSinceLastSeen = (now.getTime() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen > DECAY_THRESHOLD_DAYS) {
      return 'decaying';
    }
  }

  // Active - normal state
  return 'active';
}

/**
 * Get valid transitions from a given state
 */
export function getValidTransitions(state: ItemState): ItemState[] {
  const transitions: Record<ItemState, ItemState[]> = {
    new: ['active', 'quieted', 'archived'],
    active: ['quieted', 'decaying', 'archived'],
    quieted: ['active', 'decaying', 'archived'],
    decaying: ['active', 'archived'],
    archived: [], // Terminal state
  };
  return transitions[state];
}

/**
 * Check if a transition is valid
 */
export function canTransition(from: ItemState, to: ItemState): boolean {
  return getValidTransitions(from).includes(to);
}

/**
 * Get state metadata for UI display
 */
export function getStateMetadata(state: ItemState): {
  label: string;
  color: string;
  icon: string;
} {
  const metadata: Record<ItemState, { label: string; color: string; icon: string }> = {
    new: { label: 'New', color: '#22c55e', icon: '✨' },
    active: { label: 'Active', color: '#3b82f6', icon: '●' },
    quieted: { label: 'Quieted', color: '#f59e0b', icon: '◐' },
    decaying: { label: 'Fading', color: '#6b7280', icon: '○' },
    archived: { label: 'Archived', color: '#374151', icon: '◌' },
  };
  return metadata[state];
}

// =============================================================================
// State-based Scoring Modifiers
// =============================================================================

/**
 * Get score multiplier based on current state
 */
export function getStateScoreMultiplier(state: ItemState): number {
  const multipliers: Record<ItemState, number> = {
    new: 1.2,      // 20% boost for new items
    active: 1.0,   // No modification
    quieted: 0.1,  // Heavy suppression
    decaying: 0.5, // Reduced visibility
    archived: 0,   // Not visible
  };
  return multipliers[state];
}

/**
 * Check if item should be visible based on state
 */
export function isVisibleState(state: ItemState): boolean {
  return state !== 'archived';
}

// =============================================================================
// State Transition Helpers
// =============================================================================

/**
 * Create a state context from item signals
 */
export function createStateContext(
  signals: {
    createdAt: string;
    lastSeenAt: string | null;
    quietUntil?: string;
    ignoredStreak: number;
  },
  isRemoved = false
): StateContext {
  return {
    now: new Date(),
    createdAt: new Date(signals.createdAt),
    lastSeenAt: signals.lastSeenAt ? new Date(signals.lastSeenAt) : null,
    quietUntil: signals.quietUntil ? new Date(signals.quietUntil) : null,
    ignoredStreak: signals.ignoredStreak,
    isRemoved,
  };
}

/**
 * Log a state transition (for debugging/analytics)
 */
export function logTransition(itemId: string, transition: StateTransition): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Orbit] Item ${itemId}: ${transition.from} → ${transition.to} (${transition.reason})`
    );
  }
}
