/**
 * OrbitInput Component
 *
 * Input form for adding new items to orbit,
 * with toast notifications for feedback.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ITEM_DEFAULTS, ANIMATION } from '../config/constants';

// Sanitize input to prevent storage abuse
function sanitizeInput(value) {
  return value
    .trim()
    .slice(0, ITEM_DEFAULTS.MAX_TITLE_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars
}

export default function OrbitInput({ totalItems, onAdd }) {
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && !inputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inputFocused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = sanitizeInput(inputValue);
    if (!value) return;

    // Prevent storage abuse
    if (totalItems >= ITEM_DEFAULTS.MAX_ITEMS) {
      showToast('Orbit is full - remove some items');
      return;
    }

    onAdd(value);
    setInputValue('');

    // Show toast with context-aware message
    if (totalItems >= ITEM_DEFAULTS.MAX_VISIBLE) {
      showToast('Added to orbit (in background)');
    } else {
      showToast('Added');
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), ANIMATION.TOAST_DURATION);
  };

  return (
    <>
      <form className="add" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="/"
          spellCheck={false}
          maxLength={ITEM_DEFAULTS.MAX_TITLE_LENGTH}
          autoComplete="off"
        />
      </form>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// Export a hook for parent components that need toast functionality
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, duration = ANIMATION.TOAST_DURATION) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  return { toast, showToast };
}
