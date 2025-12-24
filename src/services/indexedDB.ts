/**
 * IndexedDB Storage Service
 *
 * Provides persistent storage using IndexedDB for better capacity
 * and performance compared to localStorage.
 *
 * Falls back to localStorage if IndexedDB is not available.
 */

import { STORAGE_KEYS } from '../config/constants';

// =============================================================================
// Types
// =============================================================================

export interface OrbitItem {
  id: string;
  title: string;
  detail?: string;
  url?: string;
  signals: Record<string, unknown>;
  computed: Record<string, unknown>;
}

interface DBSchema {
  items: OrbitItem;
  settings: Record<string, unknown>;
}

// =============================================================================
// Configuration
// =============================================================================

const DB_NAME = 'orbit-db';
const DB_VERSION = 1;
const STORES = {
  ITEMS: 'items',
  SETTINGS: 'settings',
};

// =============================================================================
// Database Connection
// =============================================================================

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or get existing database connection
 */
async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create items store with id as key
      if (!db.objectStoreNames.contains(STORES.ITEMS)) {
        const itemsStore = db.createObjectStore(STORES.ITEMS, { keyPath: 'id' });
        itemsStore.createIndex('title', 'title', { unique: false });
        itemsStore.createIndex('createdAt', 'signals.createdAt', { unique: false });
      }

      // Create settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

// =============================================================================
// Item Operations
// =============================================================================

/**
 * Get all items from IndexedDB
 */
export async function getAllItems(): Promise<OrbitItem[]> {
  if (!isIndexedDBAvailable()) {
    return fallbackGetAllItems();
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ITEMS, 'readonly');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB getAllItems failed:', error);
    return fallbackGetAllItems();
  }
}

/**
 * Save all items to IndexedDB
 */
export async function saveAllItems(items: OrbitItem[]): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return fallbackSaveAllItems(items);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ITEMS, 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);

      // Clear existing and add all
      store.clear();
      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('IndexedDB saveAllItems failed:', error);
    return fallbackSaveAllItems(items);
  }
}

/**
 * Add a single item
 */
export async function addItem(item: OrbitItem): Promise<void> {
  if (!isIndexedDBAvailable()) {
    const items = await fallbackGetAllItems();
    items.push(item);
    return fallbackSaveAllItems(items);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ITEMS, 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB addItem failed:', error);
    const items = await fallbackGetAllItems();
    items.push(item);
    return fallbackSaveAllItems(items);
  }
}

/**
 * Update a single item
 */
export async function updateItem(id: string, updated: OrbitItem): Promise<void> {
  if (!isIndexedDBAvailable()) {
    const items = await fallbackGetAllItems();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index] = updated;
      return fallbackSaveAllItems(items);
    }
    return;
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ITEMS, 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB updateItem failed:', error);
    const items = await fallbackGetAllItems();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index] = updated;
      return fallbackSaveAllItems(items);
    }
  }
}

/**
 * Remove an item by ID
 */
export async function removeItem(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    const items = await fallbackGetAllItems();
    const filtered = items.filter((i) => i.id !== id);
    return fallbackSaveAllItems(filtered);
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ITEMS, 'readwrite');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB removeItem failed:', error);
    const items = await fallbackGetAllItems();
    const filtered = items.filter((i) => i.id !== id);
    return fallbackSaveAllItems(filtered);
  }
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<OrbitItem | null> {
  if (!isIndexedDBAvailable()) {
    const items = await fallbackGetAllItems();
    return items.find((i) => i.id === id) || null;
  }

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.ITEMS, 'readonly');
      const store = transaction.objectStore(STORES.ITEMS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB getItem failed:', error);
    const items = await fallbackGetAllItems();
    return items.find((i) => i.id === id) || null;
  }
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  if (!isIndexedDBAvailable()) return false;

  try {
    const localData = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!localData) return false;

    const items = JSON.parse(localData) as OrbitItem[];
    if (items.length === 0) return false;

    // Check if IndexedDB already has data
    const existingItems = await getAllItems();
    if (existingItems.length > 0) {
      console.log('IndexedDB already has data, skipping migration');
      return false;
    }

    // Migrate items
    await saveAllItems(items);
    console.log(`Migrated ${items.length} items from localStorage to IndexedDB`);

    // Optionally clear localStorage after successful migration
    // localStorage.removeItem(STORAGE_KEYS.ITEMS);

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// =============================================================================
// Fallback (localStorage)
// =============================================================================

function fallbackGetAllItems(): OrbitItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function fallbackSaveAllItems(items: OrbitItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error('localStorage save failed:', error);
  }
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize IndexedDB and run migrations if needed
 */
export async function initializeStorage(): Promise<void> {
  if (isIndexedDBAvailable()) {
    await getDB();
    await migrateFromLocalStorage();
  }
}
