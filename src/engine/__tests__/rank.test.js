/**
 * Ranking Engine Tests
 *
 * Tests for the item ranking and interaction recording.
 */

import { rankItems, recordInteraction, pinItem, unpinItem, quietItem } from '../rank.js';
import { createItem } from '../types.js';

// Helper to create a context
function createContext(overrides = {}) {
  return {
    now: new Date().toISOString(),
    hour: 10,
    day: 1,
    device: 'desktop',
    place: 'work',
    sessionId: 'test-session',
    ...overrides,
  };
}

describe('rankItems', () => {
  it('should return empty arrays for empty input', () => {
    const context = createContext();
    const result = rankItems([], context);

    expect(result.all).toEqual([]);
    expect(result.visible).toEqual([]);
  });

  it('should return items with computed scores', () => {
    const items = [createItem('Item 1'), createItem('Item 2')];
    const context = createContext();
    const result = rankItems(items, context);

    expect(result.all).toHaveLength(2);
    result.all.forEach((item) => {
      expect(item.computed).toBeDefined();
      expect(typeof item.computed.score).toBe('number');
      expect(typeof item.computed.distance).toBe('number');
      expect(Array.isArray(item.computed.reasons)).toBe(true);
    });
  });

  it('should sort items by score descending', () => {
    const items = [
      createItem('Low score'),
      createItem('High score'),
    ];
    // Make second item pinned for higher score
    items[1].signals.isPinned = true;

    const context = createContext();
    const result = rankItems(items, context);

    expect(result.all[0].title).toBe('High score');
    expect(result.all[1].title).toBe('Low score');
  });

  it('should respect maxVisible limit', () => {
    const items = Array.from({ length: 10 }, (_, i) => createItem(`Item ${i}`));
    const context = createContext();
    const result = rankItems(items, context, 5);

    expect(result.visible).toHaveLength(5);
    expect(result.all).toHaveLength(10);
  });

  it('should boost pinned items in ranking', () => {
    // Create identical items, one pinned
    const unpinnedItem = createItem('Unpinned');
    const pinnedItem = createItem('Pinned');
    pinnedItem.signals.isPinned = true;

    const context = createContext();
    const result = rankItems([unpinnedItem, pinnedItem], context, 5);

    // Find scores
    const pinnedScore = result.all.find((i) => i.title === 'Pinned').computed.score;
    const unpinnedScore = result.all.find((i) => i.title === 'Unpinned').computed.score;

    // Pinned should have higher score
    expect(pinnedScore).toBeGreaterThan(unpinnedScore);
  });
});

describe('recordInteraction', () => {
  it('should update seenCount for seen type', () => {
    const item = createItem('Test item');
    const context = createContext();
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.seenCount).toBe(1);
  });

  it('should update openedCount for opened type', () => {
    const item = createItem('Test item');
    const context = createContext();
    const updated = recordInteraction(item, 'opened', context);

    expect(updated.signals.openedCount).toBe(1);
  });

  it('should update dismissedCount for dismissed type', () => {
    const item = createItem('Test item');
    const context = createContext();
    const updated = recordInteraction(item, 'dismissed', context);

    expect(updated.signals.dismissedCount).toBe(1);
  });

  it('should update lastSeenAt', () => {
    const item = createItem('Test item');
    const context = createContext();
    const beforeUpdate = item.signals.lastSeenAt;
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.lastSeenAt).not.toBe(beforeUpdate);
    expect(updated.signals.lastSeenAt).toBe(context.now);
  });

  it('should update hour histogram based on context.now', () => {
    const item = createItem('Test item');
    // context.now determines the hour via new Date(context.now).getHours()
    const now = new Date();
    now.setHours(14, 0, 0, 0);
    const context = createContext({ now: now.toISOString() });
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.hourHistogram[14]).toBe(1);
  });

  it('should accumulate histogram counts', () => {
    let item = createItem('Test item');
    const now = new Date();
    now.setHours(10, 0, 0, 0);
    const context = createContext({ now: now.toISOString() });

    item = recordInteraction(item, 'seen', context);
    item = recordInteraction(item, 'seen', context);
    item = recordInteraction(item, 'seen', context);

    expect(item.signals.hourHistogram[10]).toBe(3);
  });

  it('should update day histogram based on context.now', () => {
    const item = createItem('Test item');
    // Create a date that is Wednesday (day 3)
    const wednesday = new Date('2024-01-03T12:00:00Z'); // Jan 3, 2024 is Wednesday
    const context = createContext({ now: wednesday.toISOString() });
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.dayHistogram[wednesday.getDay()]).toBe(1);
  });

  it('should update place histogram', () => {
    const item = createItem('Test item');
    const context = createContext({ place: 'work' });
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.placeHistogram.work).toBe(1);
  });

  it('should update device histogram', () => {
    const item = createItem('Test item');
    const context = createContext({ device: 'mobile' });
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.deviceHistogram.mobile).toBe(1);
  });

  it('should reset ignored streak', () => {
    const item = createItem('Test item');
    item.signals.ignoredStreak = 5;
    const context = createContext();
    const updated = recordInteraction(item, 'seen', context);

    expect(updated.signals.ignoredStreak).toBe(0);
  });

  it('should not mutate the original item', () => {
    const item = createItem('Test item');
    const originalSeenCount = item.signals.seenCount;
    const context = createContext();
    recordInteraction(item, 'seen', context);

    expect(item.signals.seenCount).toBe(originalSeenCount);
  });
});

describe('pinItem', () => {
  it('should set isPinned to true', () => {
    const item = createItem('Test item');
    const updated = pinItem(item);

    expect(updated.signals.isPinned).toBe(true);
  });

  it('should set pinUntil when ISO string provided', () => {
    const item = createItem('Test item');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const updated = pinItem(item, futureDate);

    expect(updated.signals.pinUntil).toBe(futureDate);
  });

  it('should not mutate the original item', () => {
    const item = createItem('Test item');
    pinItem(item);

    expect(item.signals.isPinned).toBe(false);
  });
});

describe('unpinItem', () => {
  it('should set isPinned to false', () => {
    const item = createItem('Test item');
    item.signals.isPinned = true;
    const updated = unpinItem(item);

    expect(updated.signals.isPinned).toBe(false);
  });

  it('should clear pinUntil', () => {
    const item = createItem('Test item');
    item.signals.isPinned = true;
    item.signals.pinUntil = new Date().toISOString();
    const updated = unpinItem(item);

    expect(updated.signals.pinUntil).toBeNull();
  });
});

describe('quietItem', () => {
  it('should set quietUntil to future time', () => {
    const item = createItem('Test item');
    const context = createContext();
    const updated = quietItem(item, 4, context); // 4 hours

    expect(updated.signals.quietUntil).toBeDefined();
    const quietUntil = new Date(updated.signals.quietUntil);
    const contextNow = new Date(context.now);

    expect(quietUntil > contextNow).toBe(true);
  });

  it('should set correct duration', () => {
    const item = createItem('Test item');
    const context = createContext();
    const updated = quietItem(item, 2, context); // 2 hours

    const quietUntil = new Date(updated.signals.quietUntil);
    const contextNow = new Date(context.now);
    const hoursDiff = (quietUntil - contextNow) / (1000 * 60 * 60);

    expect(hoursDiff).toBeCloseTo(2, 0);
  });

  it('should not mutate the original item', () => {
    const item = createItem('Test item');
    const context = createContext();
    quietItem(item, 4, context);

    expect(item.signals.quietUntil).toBeUndefined();
  });
});
