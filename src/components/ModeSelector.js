/**
 * ModeSelector Component
 *
 * Allows switching between different modes (home, work, etc.)
 * with a minimal plus button to add custom modes.
 */

import React, { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../config/constants';

const DEFAULT_MODES = ['home', 'work'];

export default function ModeSelector({ currentMode, onModeChange, onModeSwitch }) {
  const [modes, setModes] = useState(DEFAULT_MODES);
  const [isAdding, setIsAdding] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const inputRef = useRef(null);

  // Load saved modes on mount
  useEffect(() => {
    const savedModes = localStorage.getItem(STORAGE_KEYS.MODES);
    if (savedModes) {
      try {
        const parsed = JSON.parse(savedModes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setModes(parsed);
        }
      } catch (e) {
        // Use default modes
      }
    }
  }, []);

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const saveModes = (newModes) => {
    localStorage.setItem(STORAGE_KEYS.MODES, JSON.stringify(newModes));
  };

  const handleModeClick = (mode, e) => {
    e.stopPropagation();
    if (mode !== currentMode) {
      onModeSwitch?.(); // Trigger sound
      onModeChange(mode);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    setIsAdding(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newModeName.trim().toLowerCase();
    if (trimmed && !modes.includes(trimmed)) {
      const newModes = [...modes, trimmed];
      setModes(newModes);
      saveModes(newModes);
      onModeSwitch?.(); // Trigger sound
      onModeChange(trimmed);
    }
    setNewModeName('');
    setIsAdding(false);
  };

  const handleAddCancel = () => {
    setNewModeName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleAddCancel();
    }
  };

  const currentIndex = modes.indexOf(currentMode);

  return (
    <div className="mode-selector" onClick={(e) => e.stopPropagation()}>
      {/* Mode pills */}
      <div className="mode-pills">
        {modes.map((mode, i) => (
          <button
            key={mode}
            className={`mode-pill ${mode === currentMode ? 'active' : ''}`}
            onClick={(e) => handleModeClick(mode, e)}
            aria-pressed={mode === currentMode}
          >
            {mode}
          </button>
        ))}

        {/* Add mode button or input */}
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="mode-add-form">
            <input
              ref={inputRef}
              type="text"
              value={newModeName}
              onChange={(e) => setNewModeName(e.target.value)}
              onBlur={handleAddCancel}
              onKeyDown={handleKeyDown}
              placeholder="mode"
              className="mode-add-input"
              maxLength={12}
            />
          </form>
        ) : (
          <button
            className="mode-add-btn"
            onClick={handleAddClick}
            aria-label="Add new mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
