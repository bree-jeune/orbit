/**
 * Crypto Service for Orbit
 *
 * Provides encryption/decryption for localStorage data using Web Crypto API.
 * Uses AES-GCM with a device-local key stored in IndexedDB.
 */

const DB_NAME = 'orbit-secure';
const STORE_NAME = 'keys';
const KEY_ID = 'master-key';

// =============================================================================
// Key Management
// =============================================================================

/**
 * Open the secure key database
 */
function openKeyDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Generate a new AES-GCM key
 */
async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable (for storage)
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to storable format
 */
async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

/**
 * Import key from stored format
 */
async function importKey(keyData) {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable after import
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create the master encryption key
 */
async function getMasterKey() {
  try {
    const db = await openKeyDB();

    // Try to get existing key
    const existingKey = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(KEY_ID);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    if (existingKey) {
      db.close();
      return await importKey(existingKey);
    }

    // Generate new key
    const newKey = await generateKey();
    const exportedKey = await exportKey(newKey);

    // Store it
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(exportedKey, KEY_ID);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    db.close();
    return newKey;
  } catch (error) {
    console.warn('[Crypto] Key management failed, using fallback:', error);
    return null;
  }
}

// Cache the key after first load
let cachedKey = null;

async function getKey() {
  if (!cachedKey) {
    cachedKey = await getMasterKey();
  }
  return cachedKey;
}

// =============================================================================
// Encryption / Decryption
// =============================================================================

/**
 * Encrypt data using AES-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Base64-encoded encrypted data with IV
 */
export async function encrypt(plaintext) {
  const key = await getKey();

  // Fallback if crypto unavailable
  if (!key) {
    return plaintext;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64 with prefix
    return 'enc:' + btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    return plaintext;
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {string} ciphertext - Base64-encoded encrypted data
 * @returns {string} Decrypted plaintext
 */
export async function decrypt(ciphertext) {
  // Check if data is encrypted
  if (!ciphertext.startsWith('enc:')) {
    return ciphertext; // Return as-is (not encrypted)
  }

  const key = await getKey();

  if (!key) {
    console.warn('[Crypto] No key available for decryption');
    return ciphertext;
  }

  try {
    // Decode base64
    const combined = Uint8Array.from(
      atob(ciphertext.slice(4)), // Remove 'enc:' prefix
      c => c.charCodeAt(0)
    );

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    return ciphertext;
  }
}

// =============================================================================
// Secure Storage Wrappers
// =============================================================================

/**
 * Securely save data to localStorage
 */
export async function secureSet(key, value) {
  const json = JSON.stringify(value);
  const encrypted = await encrypt(json);
  localStorage.setItem(key, encrypted);
}

/**
 * Securely retrieve data from localStorage
 */
export async function secureGet(key) {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;

  const decrypted = await decrypt(encrypted);
  try {
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

/**
 * Check if Web Crypto is available
 */
export function isCryptoAvailable() {
  return !!(
    typeof crypto !== 'undefined' &&
    crypto.subtle &&
    typeof indexedDB !== 'undefined'
  );
}

// =============================================================================
// Audio Integrity Verification
// =============================================================================

/**
 * Compute SHA-256 hash of a file
 */
export async function computeFileHash(url) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('[Crypto] Hash computation failed:', error);
    return null;
  }
}

/**
 * Verify a file against expected hash
 */
export async function verifyFileIntegrity(url, expectedHash) {
  const actualHash = await computeFileHash(url);
  if (!actualHash) return false;
  return actualHash === expectedHash;
}
