/**
 * OrbitInput Component
 *
 * Input form for adding new items to orbit,
 * with toast notifications for feedback.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ITEM_DEFAULTS, ANIMATION } from '../config/constants';
import { aiService, AI_CONFIG } from '../services/aiService';
import './OrbitInput.css';

// Sanitize input to prevent storage abuse
function sanitizeInput(value) {
  return value
    .trim()
    .slice(0, ITEM_DEFAULTS.MAX_TITLE_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars
}

export default function OrbitInput({ totalItems, onAdd, showToast, aiKey: propAiKey, onUpdateAiKey }) {
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Local state for the modal input, initialized from prop or localStorage/env/default
  const [apiKey, setApiKey] = useState(() => {
    if (propAiKey) return propAiKey;
    const localKey = localStorage.getItem('orbit_ai_key');
    if (localKey && localKey !== 'undefined') return localKey;
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey !== 'undefined') return envKey;
    return AI_CONFIG.DEFAULT_KEY || '';
  });

  // Keep internal apiKey in sync with prop if prop changes
  useEffect(() => {
    if (propAiKey) setApiKey(propAiKey);
  }, [propAiKey]);

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
        setShowApiKeyModal(false);
      }
      // Magic Shortcut: Cmd+Enter to Trigger AI
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && inputFocused) {
        e.preventDefault();
        handleAiSubmit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inputFocused, inputValue]);

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
    showSuccessToast(totalItems);
  };

  const handleAiSubmit = async () => {
    const value = sanitizeInput(inputValue);
    if (!value) return;

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await aiService.parseInput(value, apiKey);
      onAdd(result.title, result.detail);
      setInputValue('');
      showToast(`✨ Magic added: ${result.title}`);
    } catch (err) {
      showToast('❌ AI Failed: Check API Key');
      if (err.message.includes('400') || err.message.includes('403')) {
        setShowApiKeyModal(true);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      if (onUpdateAiKey) {
        onUpdateAiKey(apiKey.trim());
      } else {
        localStorage.setItem('orbit_ai_key', apiKey.trim());
      }
      setShowApiKeyModal(false);
    }
  };

  const showSuccessToast = (count) => {
    if (count >= ITEM_DEFAULTS.MAX_VISIBLE) {
      showToast('Added to vault');
    } else {
      showToast('Added to orbit');
    }
  };

  return (
    <>
      <div className={`input-container ${isAiLoading ? 'loading' : ''}`}>
        <form className="add" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            id="orbit-input"
            name="orbit-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={isAiLoading ? "Processing..." : "(Add an item to orbit)"}
            spellCheck={false}
            maxLength={ITEM_DEFAULTS.MAX_TITLE_LENGTH}
            autoComplete="off"
            disabled={isAiLoading}
          />
          {inputValue && (
            <button
              type="button"
              className="ai-trigger"
              onClick={handleAiSubmit}
              title="Use AI (Cmd+Enter)"
              aria-label="Process with AI"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </button>
          )}
        </form>
      </div>

      {showApiKeyModal && (
        <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Enter Gemini API Key</h3>
            <p>To use AI features, you need a Google Gemini API key. This will be stored locally in your browser.</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowApiKeyModal(false)}>Cancel</button>
              <button className="primary" onClick={saveApiKey}>Save Key</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
