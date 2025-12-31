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
  boostItem,
  quiet,
  pin,
  unpin,
  remove,
  setPlace,
} from '../store/orbitStore.js';
import { useAudio } from '../hooks/useAudio.js';
import { themeService } from '../services/themeService';
import { AI_CONFIG } from '../services/aiService';
import { ANIMATION, AUDIO, STORAGE_KEYS } from '../config/constants';
import OrbitItem from './OrbitItem.js';
import OrbitInput from './OrbitInput.js';
import MusicToggle from './MusicToggle.js';
import ModeSelector from './ModeSelector.js';
import Vault from './Vault.js';
import Walkthrough, { shouldShowWalkthrough } from './Walkthrough.js';
import Settings from './Settings.js';
import { firebaseService } from '../services/firebase';
import './OrbitSurface.css';

export default function OrbitSurface() {
  const [state, setState] = useState(getState());
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');
  const [theme, setTheme] = useState(null);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [aiKey, setAiKey] = useState(() => {
    const localKey = localStorage.getItem('orbit_ai_key');
    if (localKey && localKey !== 'undefined' && localKey !== '') {
      console.log('[Orbit] Using local API key');
      return localKey;
    }
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey !== 'undefined' && envKey !== '') {
      console.log('[Orbit] Using environment API key');
      return envKey;
    }
    console.log('[Orbit] Using default API key');
    return AI_CONFIG.DEFAULT_KEY || '';
  });
  const reminderTimeoutRef = useRef(null);
  const lastReminderRef = useRef(null);

  const {
    playNewItem,
    playModeSwitch,
    playMarkDone,
    playReminder,
    toggleMusic,
    isMusicPlaying,
    switchNoise,
    noiseType,
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
        const ageHours = (now - new Date(item.signals.createdAt).getTime()) / (1000 * 60 * 60);
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
        } else if (oldItems.length > 0) {
          // If not visible, boost the oldest one
          const oldestItem = oldItems.sort((a, b) =>
            new Date(a.signals.createdAt) - new Date(b.signals.createdAt)
          )[0];

          boostItem(oldestItem.id);
          playReminder();
          setExpandedId(oldestItem.id);
          showToast(`${oldestItem.title} needs attention`);

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
        setShowVault(false);
        setShowSettings(false);
      }
      if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
        // Toggle vault with 'v' if not in input
        if (document.activeElement.tagName !== 'INPUT') {
          setShowVault(v => !v);
        }
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

  const handleUpdateAiKey = useCallback((key) => {
    localStorage.setItem('orbit_ai_key', key);
    setAiKey(key);
    showToast('AI Key updated');
  }, [showToast]);

  const handleClearData = useCallback(() => {
    if (window.confirm('Are you sure? This will delete all local data.')) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const handleAddItem = useCallback((title, detail = '') => {
    addToOrbit(title, detail);
    playNewItem();
  }, [playNewItem]);

  const handleMarkDone = useCallback((itemId) => {
    remove(itemId);
    playMarkDone();
    setExpandedId(null);
    showToast('Marked done');
  }, [playMarkDone]);

  const showToast = useCallback((message) => {
    setToast(message);
    // Use the constant but allow override if needed
    setTimeout(() => setToast(null), ANIMATION.TOAST_DURATION);
  }, []);

  const handleGenerateTheme = async () => {
    // Check if we have items
    if (state.items.length === 0) {
      showToast('Add items first to generate a vibe');
      return;
    }

    const envKey = process.env.GEMINI_API_KEY;
    const localKey = localStorage.getItem('orbit_ai_key');
    const apiKey = (envKey && envKey !== 'undefined') ? envKey : (localKey && localKey !== 'undefined') ? localKey : AI_CONFIG.DEFAULT_KEY;
    if (!apiKey) {
      showToast('Set AI Key in input first');
      return;
    }

    setIsGeneratingTheme(true);
    showToast('Reading the stars... ✨');

    try {
      const newTheme = await themeService.generateTheme(state.items, apiKey);
      setTheme(newTheme);
      showToast(`Vibe shifted: ${newTheme.mood}`);

      // Update CSS variables for accent color if needed
      if (newTheme.visual.accent) {
        document.documentElement.style.setProperty('--orbit-accent', newTheme.visual.accent);
      }

      // Pass audio params to music toggle/hook if we were implementing dynamic audio
      if (newTheme.audio.noiseType) {
        switchNoise(newTheme.audio.noiseType);
      }
      // console.log('Audio Vibe:', newTheme.audio);

    } catch (error) {
      console.error(error);
      showToast('Failed to generate theme');
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false);
  };

  const { visibleItems, items, context, isLoading } = state;

  if (isLoading) {
    return <div className="surface"><div className="center" /></div>;
  }

  return (
    <div
      className={`surface ${transitionClass}`}
      onClick={() => setExpandedId(null)}
      style={{
        background: theme ? theme.visual.background : undefined,
        color: theme ? theme.visual.textColor : undefined,
        transition: 'background 2s ease-in-out, color 2s ease-in-out'
      }}
    >
      {/* Walkthrough for first-time users */}
      {showWalkthrough && (
        <Walkthrough onComplete={handleWalkthroughComplete} />
      )}

      {/* Mode selector with branding */}
      <ModeSelector
        currentMode={context?.place || 'home'}
        onModeChange={handleModeChange}
        onModeSwitch={playModeSwitch}
      />

      {/* Item count indicator - clickable to open vault */}
      <div className="count" onClick={(e) => { e.stopPropagation(); setShowVault(true); }} style={{ cursor: 'pointer' }} title="Open Vault">
        {visibleItems.length} of {items.length}
      </div>

      {/* Music toggle */}
      <div className="controls-row">
        <MusicToggle isPlaying={isMusicPlaying} onToggle={toggleMusic} />
        <button
          className={`theme-btn ${isGeneratingTheme ? 'spinning' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleGenerateTheme(); }}
          title="Generate Ambient Theme"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </button>
        <button
          className="settings-btn"
          onClick={(e) => { e.stopPropagation(); setShowVault(true); }}
          title="Open Vault"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <button
          className="settings-btn"
          onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
          title="Settings"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

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
        <div className="empty">what's on your mind?</div>
      )}

      {/* Input */}
      <OrbitInput
        totalItems={items.length}
        onAdd={handleAddItem}
        showToast={showToast}
        aiKey={aiKey}
        onUpdateAiKey={handleUpdateAiKey}
      />

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          audioSettings={{
            isMusicPlaying,
            noiseType,
            toggleMusic,
            switchNoise,
          }}
          aiStatus={{
            isReady: !!aiKey,
            key: aiKey,
          }}
          firebaseStatus={{
            isAvailable: firebaseService.isAvailable,
            userId: firebaseService.getUserId(),
          }}
          onUpdateAiKey={handleUpdateAiKey}
          onClearData={handleClearData}
        />
      )}

      {/* Vault Modal */}
      {showVault && (
        <Vault
          items={items}
          onClose={() => setShowVault(false)}
          onPin={pin}
          onUnpin={unpin}
          onRemove={remove}
          onDone={handleMarkDone}
          onQuiet={(id) => quiet(id, 4)}
        />
      )}

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
