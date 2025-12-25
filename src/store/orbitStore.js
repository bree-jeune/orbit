/**
 * Orbit Store
 *
 * Simple state management without external dependencies
 * Ties together engine + storage + UI
 */

import { createItem, getCurrentContext } from '../engine/types.js';
import { STORAGE_KEYS } from '../config/constants';
import { rankItems, recordInteraction, pinItem, unpinItem, quietItem } from '../engine/rank.js';
import { getAllItems, saveAllItems, addItem as storageAddItem, updateItem, removeItem, migrateToEncrypted } from '../services/storage.js';

// Simple pub/sub for state updates
const listeners = new Set();

let state = {
  items: [],
  visibleItems: [],
  context: null,
  isLoading: true,
};

/**
 * Subscribe to state changes
 * @param {Function} listener
 * @returns {Function} unsubscribe
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get current state
 * @returns {typeof state}
 */
export function getState() {
  return state;
}

/**
 * Notify all listeners
 */
function notify() {
  listeners.forEach((fn) => fn(state));
}

/**
 * Migrate old 'orbit_place' key to new STORAGE_KEYS.CONTEXT
 * This is a one-time migration for backward compatibility
 */
function migratePlaceKey() {
  const oldKey = 'orbit_place';
  const newKey = STORAGE_KEYS.CONTEXT;
  
  // Check if we have the old key and not the new key
  const oldValue = localStorage.getItem(oldKey);
  const newValue = localStorage.getItem(newKey);
  
  if (oldValue && !newValue) {
    localStorage.setItem(newKey, oldValue);
    localStorage.removeItem(oldKey);
    console.log('[Store] Migrated place from orbit_place to orbit_context');
  }
}

/**
 * Initialize store - load items and compute initial ranking
 */
export async function initialize() {
  state.isLoading = true;
  notify();

  // Migrate old place key to new key (one-time)
  migratePlaceKey();

  // Migrate unencrypted data to encrypted (one-time)
  await migrateToEncrypted();

  const items = await getAllItems();
  const context = getCurrentContext();

  const { all, visible } = rankItems(items, context);

  state = {
    items: all,
    visibleItems: visible,
    context,
    isLoading: false,
  };

  notify();
}

/**
 * Recompute rankings with fresh context
 */
export async function recompute() {
  const context = getCurrentContext();
  const { all, visible } = rankItems(state.items, context);

  state = {
    ...state,
    items: all,
    visibleItems: visible,
    context,
  };

  notify();
}

/**
 * Add a new item to orbit
 * @param {string} title
 * @param {string} [detail]
 * @param {string} [url]
 */
export async function addToOrbit(title, detail = '', url = '') {
  const item = createItem(title, detail, url);

  // Record initial interaction
  const context = getCurrentContext();
  const tracked = recordInteraction(item, 'seen', context);

  await storageAddItem(tracked);

  // Recompute with new item
  const items = [...state.items, tracked];
  const { all, visible } = rankItems(items, context);

  state = {
    ...state,
    items: all,
    visibleItems: visible,
  };

  notify();
}

/**
 * Mark item as seen (user saw it in orbit)
 * @param {string} id
 */
export async function markSeen(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const context = getCurrentContext();
  const updated = recordInteraction(item, 'seen', context);

  // Update local state first
  state.items = state.items.map((i) => (i.id === id ? updated : i));

  await updateItem(id, updated);
  await recompute();
}

/**
 * Mark item as opened (user clicked/engaged)
 * @param {string} id
 */
export async function markOpened(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const context = getCurrentContext();
  const updated = recordInteraction(item, 'opened', context);

  // Update local state first
  state.items = state.items.map((i) => (i.id === id ? updated : i));

  await updateItem(id, updated);
  await recompute();
}

/**
 * Acknowledge item (not complete - just acknowledged)
 * @param {string} id
 */
export async function acknowledge(id) {
  return markOpened(id);
}

/**
 * Quiet an item for a while
 * @param {string} id
 * @param {number} hours
 */
export async function quiet(id, hours = 4) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const context = getCurrentContext();
  const updated = quietItem(item, hours, context);

  // Update local state first
  state.items = state.items.map((i) => (i.id === id ? updated : i));

  await updateItem(id, updated);
  await recompute();
}

/**
 * Pin an item to keep it visible
 * @param {string} id
 */
export async function pin(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const updated = pinItem(item);

  // Update local state first
  state.items = state.items.map((i) => (i.id === id ? updated : i));

  await updateItem(id, updated);
  await recompute();
}

/**
 * Unpin an item
 * @param {string} id
 */
export async function unpin(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const updated = unpinItem(item);

  // Update local state first
  state.items = state.items.map((i) => (i.id === id ? updated : i));

  await updateItem(id, updated);
  await recompute();
}

/**
 * Remove item from orbit entirely
 * @param {string} id
 */
export async function remove(id) {
  await removeItem(id);

  const items = state.items.filter((i) => i.id !== id);
  const context = getCurrentContext();
  const { all, visible } = rankItems(items, context);

  state = {
    ...state,
    items: all,
    visibleItems: visible,
  };

  notify();
}

/**
 * Set current place (home/work/unknown)
 * @param {'home'|'work'|'unknown'} place
 */
export function setPlace(place) {
  localStorage.setItem(STORAGE_KEYS.CONTEXT, place);
  recompute();
}

// Auto-recompute every minute to catch time-based changes
let recomputeInterval = null;

export function startAutoRecompute() {
  if (recomputeInterval) return;
  recomputeInterval = setInterval(recompute, 60000);
}

export function stopAutoRecompute() {
  if (recomputeInterval) {
    clearInterval(recomputeInterval);
    recomputeInterval = null;
  }
}
