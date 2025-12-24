/**
 * OrbitSurface - Main Container
 *
 * The primary view showing the central planet, orbiting items,
 * and UI controls. Orchestrates child components with enhanced
 * audio triggers and reminder system.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  getState,
  subscribe,
  initialize,
  startAutoRecompute,
  stopAutoRecompute,
  addToOrbit,
  markOpened,
  quiet,
  pin,
  unpin,
  remove,
  setPlace,
} from '../store/orbitStore.js';
import { useAudio } from '../hooks/useAudio.js';
import { ANIMATION, AUDIO, STORAGE_KEYS } from '../config/constants';
import OrbitItem from './OrbitItem.js';
import OrbitInput from './OrbitInput.js';
import MusicToggle from './MusicToggle.js';
import ModeSelector from './ModeSelector.js';
import Walkthrough, { shouldShowWalkthrough } from './Walkthrough.js';
import './OrbitSurface.css';

export default function OrbitSurface() {
  const [state, setState] = useState(getState());
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');
  const reminderTimeoutRef = useRef(null);
  const lastReminderRef = useRef(null);

  const {
    playNewItem,
    playModeSwitch,
    playMarkDone,
    playReminder,
    toggleMusic,
    isMusicPlaying,
  } = useAudio();

  // Initialize store, auto-recompute, and check first run
  useEffect(() => {
    const unsub = subscribe(setState);
    initialize();
    startAutoRecompute();

    // Check if first-time user
    if (shouldShowWalkthrough()) {
      setTimeout(() => setShowWalkthrough(true), 500);
    }

    // Load last reminder time
    const lastReminder = localStorage.getItem(STORAGE_KEYS.LAST_REMINDER);
    if (lastReminder) {
      lastReminderRef.current = parseInt(lastReminder, 10);
    }

    return () => {
      unsub();
      stopAutoRecompute();
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, []);

  // Reminder system for old items
  useEffect(() => {
    const checkForReminders = () => {
      const now = Date.now();
      const lastReminder = lastReminderRef.current || 0;

      // Only remind every REMINDER_INTERVAL_MS
      if (now - lastReminder < AUDIO.REMINDER_INTERVAL_MS) {
        return;
      }

      // Find items older than threshold that need attention
      const oldItems = state.items.filter((item) => {
        if (item.signals?.isRemoved || item.signals?.isPinned) return false;
        const ageHours = (now - item.createdAt) / (1000 * 60 * 60);
        return ageHours >= AUDIO.REMINDER_AGE_HOURS;
      });

      if (oldItems.length > 0) {
        // Find a visible old item to highlight
        const visibleOldItem = state.visibleItems.find((vi) =>
          oldItems.some((oi) => oi.id === vi.id)
        );

        if (visibleOldItem) {
          playReminder();
          setExpandedId(visibleOldItem.id);
          showToast(`${visibleOldItem.title} needs attention`);

          // Update last reminder time
          lastReminderRef.current = now;
          localStorage.setItem(STORAGE_KEYS.LAST_REMINDER, now.toString());
        }
      }
    };

    // Check every minute
    const intervalId = setInterval(checkForReminders, 60000);
    // Initial check after 10 seconds
    reminderTimeoutRef.current = setTimeout(checkForReminders, 10000);

    return () => {
      clearInterval(intervalId);
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, [state.items, state.visibleItems, playReminder]);

  // Close expanded items on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setExpandedId(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleModeChange = useCallback((newMode) => {
    // Trigger dramatic transition
    setTransitionClass('mode-transitioning');
    setTimeout(() => {
      setPlace(newMode);
      setTimeout(() => setTransitionClass(''), 600);
    }, 300);
  }, []);

  const handleAddItem = useCallback((title) => {
    addToOrbit(title);
    playNewItem();
  }, [playNewItem]);

  const handleMarkDone = useCallback((itemId) => {
    remove(itemId);
    playMarkDone();
    setExpandedId(null);
    showToast('Marked done');
  }, [playMarkDone]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), ANIMATION.TOAST_DURATION);
  };

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
  };

  const { visibleItems, items, context, isLoading } = state;

  if (isLoading) {
    return <div className="surface"><div className="center" /></div>;
  }

  return (
    <div className={`surface ${transitionClass}`} onClick={() => setExpandedId(null)}>
      {/* Walkthrough for first-time users */}
      {showWalkthrough && (
        <Walkthrough onComplete={handleWalkthroughComplete} />
      )}

      {/* Branding */}
      <div className="brand">
        <div className="brand-icon" />
        <span>orbit</span>
      </div>

      {/* Mode selector with add button */}
      <ModeSelector
        currentMode={context?.place || 'home'}
        onModeChange={handleModeChange}
        onModeSwitch={playModeSwitch}
      />

      {/* Item count indicator */}
      <div className="count">
        {visibleItems.length} of {items.length}
      </div>

      {/* Music toggle */}
      <MusicToggle isPlaying={isMusicPlaying} onToggle={toggleMusic} />

      {/* Center - bigger, pulses */}
      <div className="center" />

      {/* Orbiting items */}
      {visibleItems.map((item, i) => (
        <OrbitItem
          key={item.id}
          item={item}
          index={i}
          total={visibleItems.length}
          isExpanded={expandedId === item.id}
          onExpand={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === item.id ? null : item.id);
          }}
          onAcknowledge={() => {
            markOpened(item.id);
            setExpandedId(null);
          }}
          onDone={() => handleMarkDone(item.id)}
          onQuiet={() => {
            quiet(item.id, 4);
            setExpandedId(null);
            showToast('Quieted for 4 hours');
          }}
          onPin={() => {
            item.signals.isPinned ? unpin(item.id) : pin(item.id);
          }}
          onRemove={() => {
            remove(item.id);
            setExpandedId(null);
          }}
        />
      ))}

      {/* Empty state */}
      {visibleItems.length === 0 && !showWalkthrough && (
        <div className="empty">press / to add</div>
      )}

      {/* Input */}
      <OrbitInput totalItems={items.length} onAdd={handleAddItem} />

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
