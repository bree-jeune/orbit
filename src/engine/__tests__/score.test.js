/**
 * Scoring Engine Tests
 *
 * Tests for the core relevance scoring algorithm.
 * This is the "secret sauce" - ensuring it works correctly is critical.
 */

import { computeRelevance, scoreToDistance } from '../score.js';
import { createItem } from '../types.js';

// Helper to create a context
function createContext(overrides = {}) {
  return {
    now: new Date().toISOString(),
    hour: 10,
    day: 1, // Monday
    device: 'desktop',
    place: 'work',
    sessionId: 'test-session',
    ...overrides,
  };
}

// Helper to create an item with custom signals
function createTestItem(title, signalOverrides = {}) {
  const item = createItem(title);
  item.signals = { ...item.signals, ...signalOverrides };
  return item;
}

describe('computeRelevance', () => {
  describe('basic scoring', () => {
    it('should return a score between 0 and 1', () => {
      const item = createItem('Test item');
      const context = createContext();
      const result = computeRelevance(item, context);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should return an array of reasons', () => {
      const item = createItem('Test item');
      const context = createContext();
      const result = computeRelevance(item, context);

      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should give new items a novelty boost', () => {
      const newItem = createTestItem('New item', {
        createdAt: new Date().toISOString(),
      });
      const oldItem = createTestItem('Old item', {
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const context = createContext();

      const newScore = computeRelevance(newItem, context);
      const oldScore = computeRelevance(oldItem, context);

      expect(newScore.score).toBeGreaterThan(oldScore.score);
      expect(newScore.reasons).toContain('newly added');
    });
  });

  describe('pinned items', () => {
    it('should boost score for pinned items', () => {
      const pinnedItem = createTestItem('Pinned item', { isPinned: true });
      const normalItem = createTestItem('Normal item', { isPinned: false });
      const context = createContext();

      const pinnedScore = computeRelevance(pinnedItem, context);
      const normalScore = computeRelevance(normalItem, context);

      expect(pinnedScore.score).toBeGreaterThan(normalScore.score);
      expect(pinnedScore.reasons).toContain('pinned');
    });

    it('should not boost expired pins', () => {
      const expiredPin = createTestItem('Expired pin', {
        isPinned: true,
        pinUntil: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      });
      const context = createContext();

      const result = computeRelevance(expiredPin, context);

      expect(result.reasons).not.toContain('pinned');
    });

    it('should boost valid pins with future expiry', () => {
      const validPin = createTestItem('Valid pin', {
        isPinned: true,
        pinUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      });
      const context = createContext();

      const result = computeRelevance(validPin, context);

      expect(result.reasons).toContain('pinned');
    });
  });

  describe('quieted items', () => {
    it('should heavily suppress score for quieted items', () => {
      const quietedItem = createTestItem('Quieted item', {
        quietUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      });
      const normalItem = createTestItem('Normal item');
      const context = createContext();

      const quietedScore = computeRelevance(quietedItem, context);
      const normalScore = computeRelevance(normalItem, context);

      expect(quietedScore.score).toBeLessThan(normalScore.score * 0.5);
      expect(quietedScore.reasons).toContain('quieted');
    });

    it('should not suppress expired quiet', () => {
      const expiredQuiet = createTestItem('Expired quiet', {
        quietUntil: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      });
      const context = createContext();

      const result = computeRelevance(expiredQuiet, context);

      expect(result.reasons).not.toContain('quieted');
    });
  });

  describe('time affinity', () => {
    it('should boost items frequently seen at the current hour', () => {
      const hourMatch = createTestItem('Hour match', {
        hourHistogram: { 10: 10, 14: 2 }, // Most seen at hour 10
      });
      const hourMismatch = createTestItem('Hour mismatch', {
        hourHistogram: { 22: 10, 23: 5 }, // Most seen at night
      });
      const context = createContext({ hour: 10 });

      const matchScore = computeRelevance(hourMatch, context);
      const mismatchScore = computeRelevance(hourMismatch, context);

      expect(matchScore.score).toBeGreaterThan(mismatchScore.score);
    });

    it('should boost items frequently seen on the current day', () => {
      const dayMatch = createTestItem('Day match', {
        dayHistogram: { 1: 10, 5: 2 }, // Most seen on Monday
      });
      const dayMismatch = createTestItem('Day mismatch', {
        dayHistogram: { 6: 10, 0: 5 }, // Most seen on weekends
      });
      const context = createContext({ day: 1 }); // Monday

      const matchScore = computeRelevance(dayMatch, context);
      const mismatchScore = computeRelevance(dayMismatch, context);

      expect(matchScore.score).toBeGreaterThan(mismatchScore.score);
    });
  });

  describe('place affinity', () => {
    it('should boost items frequently seen at the current place', () => {
      const workItem = createTestItem('Work item', {
        placeHistogram: { work: 10, home: 2 },
      });
      const homeItem = createTestItem('Home item', {
        placeHistogram: { work: 2, home: 10 },
      });
      const workContext = createContext({ place: 'work' });

      const workScore = computeRelevance(workItem, workContext);
      const homeScore = computeRelevance(homeItem, workContext);

      expect(workScore.score).toBeGreaterThan(homeScore.score);
      expect(workScore.reasons).toContain('often seen at work');
    });
  });

  describe('device affinity', () => {
    it('should boost items frequently seen on the current device', () => {
      const desktopItem = createTestItem('Desktop item', {
        deviceHistogram: { desktop: 10, mobile: 2 },
      });
      const mobileItem = createTestItem('Mobile item', {
        deviceHistogram: { desktop: 2, mobile: 10 },
      });
      const desktopContext = createContext({ device: 'desktop' });

      const desktopScore = computeRelevance(desktopItem, desktopContext);
      const mobileScore = computeRelevance(mobileItem, desktopContext);

      expect(desktopScore.score).toBeGreaterThan(mobileScore.score);
    });
  });

  describe('recency boost', () => {
    it('should boost recently seen items', () => {
      const recentItem = createTestItem('Recent item', {
        lastSeenAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      });
      const oldItem = createTestItem('Old item', {
        lastSeenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      });
      const context = createContext();

      const recentScore = computeRelevance(recentItem, context);
      const oldScore = computeRelevance(oldItem, context);

      expect(recentScore.score).toBeGreaterThan(oldScore.score);
      expect(recentScore.reasons).toContain('recently on your mind');
    });

    it('should not give recency boost to never-seen items', () => {
      const neverSeen = createTestItem('Never seen', {
        lastSeenAt: null,
      });
      const context = createContext();

      const result = computeRelevance(neverSeen, context);

      expect(result.reasons).not.toContain('recently on your mind');
    });
  });

  describe('frequency boost', () => {
    it('should boost frequently accessed items', () => {
      const frequentItem = createTestItem('Frequent item', {
        seenCount: 50,
        openedCount: 20,
      });
      const rareItem = createTestItem('Rare item', {
        seenCount: 2,
        openedCount: 1,
      });
      const context = createContext();

      const frequentScore = computeRelevance(frequentItem, context);
      const rareScore = computeRelevance(rareItem, context);

      expect(frequentScore.score).toBeGreaterThan(rareScore.score);
    });

    it('should weight opens more than views', () => {
      const manyOpens = createTestItem('Many opens', {
        seenCount: 10,
        openedCount: 10,
      });
      const manyViews = createTestItem('Many views', {
        seenCount: 20,
        openedCount: 0,
      });
      const context = createContext();

      const opensScore = computeRelevance(manyOpens, context);
      const viewsScore = computeRelevance(manyViews, context);

      // Opens count 2x, so 10 opens = 20 "points" vs 20 views = 20 "points"
      // Actually with the formula: interactions = seen + opened*2
      // manyOpens: 10 + 10*2 = 30
      // manyViews: 20 + 0*2 = 20
      expect(opensScore.score).toBeGreaterThan(viewsScore.score);
    });
  });

  describe('decay', () => {
    it('should decay items with ignored streak', () => {
      const ignoredItem = createTestItem('Ignored item', {
        ignoredStreak: 5,
        lastSeenAt: new Date().toISOString(),
      });
      const freshItem = createTestItem('Fresh item', {
        ignoredStreak: 0,
        lastSeenAt: new Date().toISOString(),
      });
      const context = createContext();

      const ignoredScore = computeRelevance(ignoredItem, context);
      const freshScore = computeRelevance(freshItem, context);

      expect(ignoredScore.score).toBeLessThan(freshScore.score);
    });

    it('should mark fading items with reason when decay is significant', () => {
      // Decay threshold is 0.3, streakDecay = ignoredStreak * 0.1 capped at 0.5
      // Need ignoredStreak >= 4 for decay > 0.3
      // Also must be old item (no novelty) for decay reason to show
      const fadingItem = createTestItem('Fading item', {
        ignoredStreak: 5,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days old
        lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // seen 5 days ago
      });
      const context = createContext();

      const result = computeRelevance(fadingItem, context);

      expect(result.reasons).toContain('fading from focus');
    });
  });
});

describe('scoreToDistance', () => {
  it('should convert high scores to low distances', () => {
    expect(scoreToDistance(1)).toBe(0);
    expect(scoreToDistance(0)).toBe(1);
    expect(scoreToDistance(0.5)).toBe(0.5);
  });

  it('should be linear inverse', () => {
    expect(scoreToDistance(0.8)).toBeCloseTo(0.2);
    expect(scoreToDistance(0.3)).toBeCloseTo(0.7);
  });
});
