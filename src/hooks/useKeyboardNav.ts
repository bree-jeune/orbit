/**
 * Keyboard Navigation Hook
 *
 * Provides keyboard navigation for the orbit interface.
 * Supports arrow keys, tab, enter, and escape.
 */

import { useCallback, useEffect, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface KeyboardNavOptions {
  items: Array<{ id: string }>;
  onSelect?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDismiss?: () => void;
  enabled?: boolean;
}

export interface KeyboardNavState {
  focusedIndex: number;
  focusedId: string | null;
}

export interface KeyboardNavActions {
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  activateFocused: () => void;
  clearFocus: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useKeyboardNav({
  items,
  onSelect,
  onActivate,
  onDismiss,
  enabled = true,
}: KeyboardNavOptions): KeyboardNavState & KeyboardNavActions {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const focusedId = focusedIndex >= 0 && focusedIndex < items.length
    ? items[focusedIndex].id
    : null;

  // Focus navigation
  const focusNext = useCallback(() => {
    if (items.length === 0) return;
    setFocusedIndex((prev) => {
      const next = prev < items.length - 1 ? prev + 1 : 0;
      onSelect?.(items[next].id);
      return next;
    });
  }, [items, onSelect]);

  const focusPrevious = useCallback(() => {
    if (items.length === 0) return;
    setFocusedIndex((prev) => {
      const next = prev > 0 ? prev - 1 : items.length - 1;
      onSelect?.(items[next].id);
      return next;
    });
  }, [items, onSelect]);

  const focusFirst = useCallback(() => {
    if (items.length === 0) return;
    setFocusedIndex(0);
    onSelect?.(items[0].id);
  }, [items, onSelect]);

  const focusLast = useCallback(() => {
    if (items.length === 0) return;
    setFocusedIndex(items.length - 1);
    onSelect?.(items[items.length - 1].id);
  }, [items, onSelect]);

  const activateFocused = useCallback(() => {
    if (focusedId) {
      onActivate?.(focusedId);
    }
  }, [focusedId, onActivate]);

  const clearFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            focusNext();
          }
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          focusPrevious();
          break;

        case 'Tab':
          if (e.shiftKey) {
            e.preventDefault();
            focusPrevious();
          }
          break;

        case 'Home':
          e.preventDefault();
          focusFirst();
          break;

        case 'End':
          e.preventDefault();
          focusLast();
          break;

        case 'Enter':
        case ' ':
          if (focusedId) {
            e.preventDefault();
            activateFocused();
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (focusedIndex >= 0) {
            clearFocus();
          } else {
            onDismiss?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    activateFocused,
    clearFocus,
    focusedId,
    focusedIndex,
    onDismiss,
  ]);

  // Reset focus when items change
  useEffect(() => {
    if (focusedIndex >= items.length) {
      setFocusedIndex(items.length > 0 ? items.length - 1 : -1);
    }
  }, [items.length, focusedIndex]);

  return {
    focusedIndex,
    focusedId,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    activateFocused,
    clearFocus,
  };
}

// =============================================================================
// Screen Reader Announcements
// =============================================================================

let announcer: HTMLElement | null = null;

/**
 * Create the announcer element
 */
function getAnnouncer(): HTMLElement {
  if (announcer) return announcer;

  announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('role', 'status');
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);

  return announcer;
}

/**
 * Announce a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = getAnnouncer();
  el.setAttribute('aria-live', priority);
  el.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    el.textContent = '';
  }, 1000);
}

// =============================================================================
// Focus Management
// =============================================================================

/**
 * Trap focus within a container (for modals)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled = true): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = container.querySelectorAll(focusableSelector);
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enabled]);
}
