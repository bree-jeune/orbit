/**
 * Orbit Engine - Ranking
 *
 * The "5 Things" Rule:
 * - Unlimited items in orbit
 * - Only 3-5 surfaced at any moment
 *
 * Human working memory caps at ~4
 * Recognition beats recall
 * The brain trusts systems that don't overwhelm
 */

import { computeRelevance, scoreToDistance } from './score.js';
import { DEFAULTS } from './types.js';

/**
 * Rank all items and return visible set
 * @param {import('./types.js').OrbitItem[]} items
 * @param {import('./types.js').OrbitContext} context
 * @param {number} [maxVisible]
 * @returns {{all: OrbitItem[], visible: OrbitItem[]}}
 */
export function rankItems(items, context, maxVisible = DEFAULTS.MAX_VISIBLE) {
  // Score each item
  const scored = items.map((item) => {
    const { score, reasons } = computeRelevance(item, context);
    return {
      ...item,
      computed: {
        score,
        distance: scoreToDistance(score),
        reasons,
        updatedAt: context.now,
      },
    };
  });

  // Sort by score descending (highest relevance first)
  scored.sort((a, b) => b.computed.score - a.computed.score);

  // Slice visible set
  const visible = scored.slice(0, maxVisible);

  return {
    all: scored,
    visible,
  };
}

/**
 * Record an interaction with an item
 * Updates histograms and counters for learning
 * @param {import('./types.js').OrbitItem} item
 * @param {'seen'|'opened'|'dismissed'} action
 * @param {import('./types.js').OrbitContext} context
 * @returns {import('./types.js').OrbitItem}
 */
export function recordInteraction(item, action, context) {
  const now = new Date(context.now);
  const signals = { ...item.signals };

  // Update counters
  if (action === 'seen') {
    signals.seenCount = (signals.seenCount || 0) + 1;
    signals.lastSeenAt = context.now;
    signals.ignoredStreak = 0; // Reset ignored streak
  } else if (action === 'opened') {
    signals.openedCount = (signals.openedCount || 0) + 1;
    signals.lastSeenAt = context.now;
    signals.ignoredStreak = 0;
  } else if (action === 'dismissed') {
    signals.dismissedCount = (signals.dismissedCount || 0) + 1;
    signals.ignoredStreak = (signals.ignoredStreak || 0) + 1;
  }

  // Update time histograms
  const hour = now.getHours();
  const day = now.getDay();
  signals.hourHistogram = signals.hourHistogram || {};
  signals.dayHistogram = signals.dayHistogram || {};
  signals.hourHistogram[hour] = (signals.hourHistogram[hour] || 0) + 1;
  signals.dayHistogram[day] = (signals.dayHistogram[day] || 0) + 1;

  // Update place histogram
  signals.placeHistogram = signals.placeHistogram || {};
  signals.placeHistogram[context.place] =
    (signals.placeHistogram[context.place] || 0) + 1;

  // Update device histogram
  signals.deviceHistogram = signals.deviceHistogram || {};
  signals.deviceHistogram[context.device] =
    (signals.deviceHistogram[context.device] || 0) + 1;

  return {
    ...item,
    signals,
  };
}

/**
 * Pin an item (keeps it visible regardless of decay)
 * @param {import('./types.js').OrbitItem} item
 * @param {string} [until] - ISO date string, optional expiry
 * @returns {import('./types.js').OrbitItem}
 */
export function pinItem(item, until = null) {
  return {
    ...item,
    signals: {
      ...item.signals,
      isPinned: true,
      pinUntil: until,
    },
  };
}

/**
 * Unpin an item
 * @param {import('./types.js').OrbitItem} item
 * @returns {import('./types.js').OrbitItem}
 */
export function unpinItem(item) {
  return {
    ...item,
    signals: {
      ...item.signals,
      isPinned: false,
      pinUntil: null,
    },
  };
}

/**
 * "Quiet for now" - temporary distance increase
 * @param {import('./types.js').OrbitItem} item
 * @param {number} hours - how long to quiet
 * @param {import('./types.js').OrbitContext} context
 * @returns {import('./types.js').OrbitItem}
 */
export function quietItem(item, hours, context) {
  const quietUntil = new Date(
    new Date(context.now).getTime() + hours * 60 * 60 * 1000
  ).toISOString();

  return {
    ...item,
    signals: {
      ...item.signals,
      quietUntil,
      dismissedCount: (item.signals.dismissedCount || 0) + 1,
    },
  };
}
