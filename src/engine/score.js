/**
 * Orbit Engine - Relevance Scoring
 *
 * Context > Priority
 * Each signal contributes weight, not rules.
 */

import { SCORING_WEIGHTS, ITEM_DEFAULTS } from '../config/constants';

// Use centralized weights
const WEIGHTS = SCORING_WEIGHTS;

/**
 * Compute relevance score for an item given current context
 * @param {import('./types.js').OrbitItem} item
 * @param {import('./types.js').OrbitContext} context
 * @returns {{score: number, reasons: string[]}}
 */
export function computeRelevance(item, context) {
  const reasons = [];
  let score = 0;

  // Time affinity - does this item historically appear at this hour/day?
  const timeScore = computeTimeAffinity(item, context);
  score += timeScore * WEIGHTS.TIME;
  if (timeScore > 0.5) reasons.push('matches your usual time');

  // Place affinity - does this item belong here?
  const placeScore = computePlaceAffinity(item, context);
  score += placeScore * WEIGHTS.PLACE;
  if (placeScore > 0.5) reasons.push(`often seen at ${context.place}`);

  // Device affinity - desktop vs mobile context
  const deviceScore = computeDeviceAffinity(item, context);
  score += deviceScore * WEIGHTS.DEVICE;
  if (deviceScore > 0.5) reasons.push(`fits ${context.device} context`);

  // Recency boost - recently interacted items stay closer
  const recencyScore = computeRecencyBoost(item, context);
  score += recencyScore * WEIGHTS.RECENCY;
  if (recencyScore > 0.7) reasons.push('recently on your mind');

  // Frequency boost - often accessed items matter
  const frequencyScore = computeFrequencyBoost(item);
  score += frequencyScore * WEIGHTS.FREQUENCY;
  if (frequencyScore > 0.5) reasons.push('frequently accessed');

  // Pinned items get a boost
  if (item.signals.isPinned) {
    const pinValid = !item.signals.pinUntil ||
      new Date(item.signals.pinUntil) > new Date(context.now);
    if (pinValid) {
      score += WEIGHTS.PINNED;
      reasons.push('pinned');
    }
  }

  // Novelty - new items get a brief boost
  const noveltyScore = computeNoveltyBoost(item, context);
  score += noveltyScore * WEIGHTS.NOVELTY;
  if (noveltyScore > 0.5) reasons.push('newly added');

  // Decay - ignored items drift away
  const decay = computeDecay(item, context);
  score *= (1 - decay);
  if (decay > 0.3) reasons.push('fading from focus');

  // Quiet - temporarily suppress items
  if (item.signals.quietUntil) {
    const quietUntil = new Date(item.signals.quietUntil).getTime();
    const now = new Date(context.now).getTime();
    if (now < quietUntil) {
      // Item is quieted - heavily suppress score
      score *= 0.1;
      reasons.push('quieted');
    }
  }

  return {
    score: normalize(score),
    reasons,
  };
}

/**
 * Time of day + day of week affinity
 */
function computeTimeAffinity(item, context) {
  const { hourHistogram = {}, dayHistogram = {} } = item.signals;

  // Hour affinity
  const hourCount = hourHistogram[context.hour] || 0;
  const totalHours = Object.values(hourHistogram).reduce((a, b) => a + b, 0);
  const hourAffinity = totalHours > 0 ? hourCount / totalHours : 0;

  // Day affinity
  const dayCount = dayHistogram[context.day] || 0;
  const totalDays = Object.values(dayHistogram).reduce((a, b) => a + b, 0);
  const dayAffinity = totalDays > 0 ? dayCount / totalDays : 0;

  // Weighted average, hour matters more
  return hourAffinity * 0.7 + dayAffinity * 0.3;
}

/**
 * Location affinity
 */
function computePlaceAffinity(item, context) {
  const { placeHistogram = {} } = item.signals;
  const placeCount = placeHistogram[context.place] || 0;
  const total = Object.values(placeHistogram).reduce((a, b) => a + b, 0);
  return total > 0 ? placeCount / total : 0;
}

/**
 * Device type affinity
 */
function computeDeviceAffinity(item, context) {
  const { deviceHistogram = {} } = item.signals;
  const deviceCount = deviceHistogram[context.device] || 0;
  const total = Object.values(deviceHistogram).reduce((a, b) => a + b, 0);
  return total > 0 ? deviceCount / total : 0;
}

/**
 * Recency boost - exponential decay from last interaction
 */
function computeRecencyBoost(item, context) {
  if (!item.signals.lastSeenAt) return 0;

  const now = new Date(context.now).getTime();
  const last = new Date(item.signals.lastSeenAt).getTime();
  const ageMs = now - last;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Exponential decay over DECAY_DAYS
  return Math.exp(-ageDays / ITEM_DEFAULTS.DECAY_DAYS);
}

/**
 * Frequency boost - log scale to prevent runaway
 */
function computeFrequencyBoost(item) {
  const { seenCount = 0, openedCount = 0 } = item.signals;
  const interactions = seenCount + openedCount * 2; // opens count more
  // Log scale capped at ~1.0 for 100+ interactions
  return Math.min(1, Math.log10(interactions + 1) / 2);
}

/**
 * Novelty boost - new items get attention briefly
 */
function computeNoveltyBoost(item, context) {
  const created = new Date(item.signals.createdAt).getTime();
  const now = new Date(context.now).getTime();
  const ageHours = (now - created) / (1000 * 60 * 60);

  // Full boost for first 24 hours, fades over 72
  if (ageHours < 24) return 1;
  if (ageHours < 72) return 1 - (ageHours - 24) / 48;
  return 0;
}

/**
 * Decay from being ignored
 */
function computeDecay(item, context) {
  const { ignoredStreak = 0, lastSeenAt } = item.signals;

  // Streak decay
  const streakDecay = Math.min(0.5, ignoredStreak * 0.1);

  // Age decay if never seen
  if (!lastSeenAt) {
    const created = new Date(item.signals.createdAt).getTime();
    const now = new Date(context.now).getTime();
    const ageDays = (now - created) / (1000 * 60 * 60 * 24);
    return Math.min(0.8, ageDays / 30); // Max 80% decay over 30 days
  }

  return streakDecay;
}

/**
 * Clamp score to 0-1
 */
function normalize(score) {
  return Math.max(0, Math.min(1, score));
}

/**
 * Convert score to distance (inverse relationship)
 * Higher score = closer = lower distance
 */
export function scoreToDistance(score) {
  return 1 - score;
}
