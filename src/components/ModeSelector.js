/**
 * ModeSelector Component
 *
 * Allows switching between different modes (home, work, etc.)
 * with a minimal plus button to add custom modes and delete option.
 */

import React, { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../config/constants';

const DEFAULT_MODES = ['home', 'work'];

export default function ModeSelector({ currentMode, onModeChange, onModeSwitch }) {
  const [modes, setModes] = useState(DEFAULT_MODES);
  const [isAdding, setIsAdding] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [longPressMode, setLongPressMode] = useState(null);
  const inputRef = useRef(null);
  const longPressTimer = useRef(null);

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

  // Close delete confirmation on outside click
  useEffect(() => {
    if (longPressMode) {
      const handleClick = () => setLongPressMode(null);
      setTimeout(() => window.addEventListener('click', handleClick), 0);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [longPressMode]);

  const saveModes = (newModes) => {
    localStorage.setItem(STORAGE_KEYS.MODES, JSON.stringify(newModes));
  };

  const handleModeClick = (mode, e) => {
    e.stopPropagation();
    if (longPressMode === mode) return;
    if (mode !== currentMode) {
      onModeSwitch?.();
      onModeChange(mode);
    }
  };

  const handleModeMouseDown = (mode, e) => {
    if (DEFAULT_MODES.includes(mode)) return; // Can't delete defaults
    longPressTimer.current = setTimeout(() => {
      setLongPressMode(mode);
    }, 500);
  };

  const handleModeMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDeleteMode = (mode, e) => {
    e.stopPropagation();
    const newModes = modes.filter((m) => m !== mode);
    setModes(newModes);
    saveModes(newModes);
    setLongPressMode(null);
    
    // Switch to first mode if deleting current
    if (mode === currentMode) {
      onModeSwitch?.();
      onModeChange(newModes[0]);
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
      onModeSwitch?.();
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

  return (
    <div className="mode-selector" onClick={(e) => e.stopPropagation()}>
      {/* Branding */}
      <div className="brand">
        <div className="brand-icon" />
        <span>orbit</span>
      </div>

      {/* Mode pills */}
      <div className="mode-pills">
        {modes.map((mode) => (
          <div key={mode} className="mode-pill-wrapper">
            <button
              className={`mode-pill ${mode === currentMode ? 'active' : ''}`}
              onClick={(e) => handleModeClick(mode, e)}
              onMouseDown={(e) => handleModeMouseDown(mode, e)}
              onMouseUp={handleModeMouseUp}
              onMouseLeave={handleModeMouseUp}
              onTouchStart={(e) => handleModeMouseDown(mode, e)}
              onTouchEnd={handleModeMouseUp}
              aria-pressed={mode === currentMode}
            >
              {mode}
            </button>
            {longPressMode === mode && (
              <button
                className="mode-delete-btn"
                onClick={(e) => handleDeleteMode(mode, e)}
                aria-label={`Delete ${mode} mode`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
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
