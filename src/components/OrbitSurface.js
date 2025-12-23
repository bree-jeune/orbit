/**
 * OrbitSurface - Main Container
 *
 * The primary view showing the central planet, orbiting items,
 * and UI controls. Orchestrates child components.
 */

import React, { useEffect, useState } from 'react';
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
import { ANIMATION } from '../config/constants.js';
import OrbitItem from './OrbitItem.js';
import OrbitInput from './OrbitInput.js';
import MusicToggle from './MusicToggle.js';
import './OrbitSurface.css';

export default function OrbitSurface() {
  const [state, setState] = useState(getState());
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const { playHover, playClick, toggleMusic, isMusicPlaying } = useAudio();

  // Initialize store and auto-recompute
  useEffect(() => {
    const unsub = subscribe(setState);
    initialize();
    startAutoRecompute();
    return () => {
      unsub();
      stopAutoRecompute();
    };
  }, []);

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

  const handlePlaceToggle = () => {
    const newPlace = state.context?.place === 'work' ? 'home' : 'work';
    setPlace(newPlace);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), ANIMATION.TOAST_DURATION);
  };

  const { visibleItems, items, context, isLoading } = state;

  if (isLoading) {
    return <div className="surface"><div className="center" /></div>;
  }

  return (
    <div className="surface" onClick={() => setExpandedId(null)}>
      {/* Branding */}
      <div className="brand">
        <div className="brand-icon" />
        <span>orbit</span>
      </div>

      {/* Context toggle */}
      <div className="place" onClick={(e) => { e.stopPropagation(); handlePlaceToggle(); }}>
        {context?.place === 'work' ? 'work' : 'home'}
      </div>

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
          onHover={playHover}
          onClick={playClick}
        />
      ))}

      {/* Empty state */}
      {visibleItems.length === 0 && (
        <div className="empty">press / to add</div>
      )}

      {/* Input */}
      <OrbitInput totalItems={items.length} onAdd={addToOrbit} />

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
