/**
 * Service Worker Registration
 *
 * Handles registration and lifecycle of the service worker
 * for offline support.
 */

// =============================================================================
// Configuration
// =============================================================================

const SW_PATH = '/sw.js';

// =============================================================================
// Registration
// =============================================================================

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });

    console.log('[SW] Registration successful:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[SW] New version available');
            notifyUpdate();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('[SW] Unregistration:', result ? 'success' : 'failed');
    return result;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

// =============================================================================
// Update Handling
// =============================================================================

let updateCallback: (() => void) | null = null;

/**
 * Set callback for when an update is available
 */
export function onUpdate(callback: () => void): void {
  updateCallback = callback;
}

/**
 * Notify about available update
 */
function notifyUpdate(): void {
  if (updateCallback) {
    updateCallback();
  }
}

/**
 * Force update to new version
 */
export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;

  if (registration.waiting) {
    // Tell the waiting service worker to activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page when new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

// =============================================================================
// Offline Status
// =============================================================================

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Subscribe to online/offline status changes
 */
export function onOnlineStatusChange(
  callback: (isOnline: boolean) => void
): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if running as a PWA (standalone mode)
 */
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize service worker (call on app start)
 */
export function initializeServiceWorker(): void {
  if (process.env.NODE_ENV === 'production') {
    // Only register in production
    registerServiceWorker();
  }
}
