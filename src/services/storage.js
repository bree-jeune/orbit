/**
 * Orbit Storage Service
 *
 * Local storage with optional encryption via Web Crypto API.
 * Backwards compatible with unencrypted data.
 */

import { STORAGE_KEYS, ITEM_DEFAULTS } from '../config/constants';
import { encrypt, decrypt, isCryptoAvailable } from './crypto.js';

const STORAGE_KEY = STORAGE_KEYS.ITEMS;
const SETTINGS_KEY = 'orbit_settings';

// Flag to enable/disable encryption (can be toggled for debugging)
const ENCRYPTION_ENABLED = true;

/**
 * Get all items from storage
 * @returns {Promise<import('../engine/types.js').OrbitItem[]>}
 */
export async function getAllItems() {
  try {
    // Try Chrome storage first (for extension)
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          resolve(result[STORAGE_KEY] || []);
        });
      });
    }

    // Fall back to localStorage with decryption
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    // Check if data is encrypted
    if (data.startsWith('enc:') && ENCRYPTION_ENABLED && isCryptoAvailable()) {
      const decrypted = await decrypt(data);
      return JSON.parse(decrypted);
    }

    // Unencrypted data (backwards compatible)
    return JSON.parse(data);
  } catch (e) {
    console.error('Storage read failed:', e);
    return [];
  }
}

/**
 * Save all items to storage
 * @param {import('../engine/types.js').OrbitItem[]} items
 * @returns {Promise<void>}
 */
export async function saveAllItems(items) {
  try {
    // Try Chrome storage first
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: items }, resolve);
      });
    }

    // Fall back to localStorage with encryption
    const json = JSON.stringify(items);

    if (ENCRYPTION_ENABLED && isCryptoAvailable()) {
      const encrypted = await encrypt(json);
      localStorage.setItem(STORAGE_KEY, encrypted);
    } else {
      localStorage.setItem(STORAGE_KEY, json);
    }
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

/**
 * Add a single item
 * @param {import('../engine/types.js').OrbitItem} item
 * @returns {Promise<void>}
 */
export async function addItem(item) {
  const items = await getAllItems();
  items.push(item);
  await saveAllItems(items);
}

/**
 * Update a single item by ID
 * @param {string} id
 * @param {import('../engine/types.js').OrbitItem} updated
 * @returns {Promise<void>}
 */
export async function updateItem(id, updated) {
  const items = await getAllItems();
  const index = items.findIndex((i) => i.id === id);
  if (index !== -1) {
    items[index] = updated;
    await saveAllItems(items);
  }
}

/**
 * Remove an item by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeItem(id) {
  const items = await getAllItems();
  const filtered = items.filter((i) => i.id !== id);
  await saveAllItems(filtered);
}

/**
 * Get settings
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([SETTINGS_KEY], (result) => {
          resolve(result[SETTINGS_KEY] || defaultSettings());
        });
      });
    }

    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : defaultSettings();
  } catch (e) {
    return defaultSettings();
  }
}

/**
 * Save settings
 * @param {Object} settings
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [SETTINGS_KEY]: settings }, resolve);
      });
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Settings write failed:', e);
  }
}

function defaultSettings() {
  return {
    maxVisible: ITEM_DEFAULTS.MAX_VISIBLE,
    place: 'unknown',
    theme: 'dark',
  };
}

/**
 * Migrate unencrypted data to encrypted
 * Call this once on app startup if needed
 */
export async function migrateToEncrypted() {
  if (!ENCRYPTION_ENABLED || !isCryptoAvailable()) return;

  const data = localStorage.getItem(STORAGE_KEY);
  if (!data || data.startsWith('enc:')) return; // Already encrypted or empty

  try {
    const items = JSON.parse(data);
    await saveAllItems(items); // Re-save with encryption
    console.log('[Storage] Migrated to encrypted storage');
  } catch (e) {
    console.error('[Storage] Migration failed:', e);
  }
}
