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
import './OrbitSurface.css';

export default function OrbitSurface() {
  const [state, setState] = useState(getState());
  const [inputValue, setInputValue] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    // Subscribe to store updates
    const unsub = subscribe(setState);

    // Initialize and start auto-recompute
    initialize();
    startAutoRecompute();

    return () => {
      unsub();
      stopAutoRecompute();
    };
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addToOrbit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSelectedId(null);
    }
  };

  const { visibleItems, context, isLoading } = state;

  if (isLoading) {
    return (
      <div className="orbit-surface">
        <div className="orbit-loading">
          <div className="orbit-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="orbit-surface" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Context indicator */}
      <div className="orbit-context">
        <button
          className={`place-btn ${context?.place === 'home' ? 'active' : ''}`}
          onClick={() => setPlace('home')}
        >
          Home
        </button>
        <button
          className={`place-btn ${context?.place === 'work' ? 'active' : ''}`}
          onClick={() => setPlace('work')}
        >
          Work
        </button>
      </div>

      {/* Central orbit area */}
      <div className="orbit-center">
        {/* Center dot - represents "now" */}
        <div className="orbit-now" />

        {/* Visible items arranged in orbit */}
        {visibleItems.map((item, index) => (
          <OrbitItem
            key={item.id}
            item={item}
            index={index}
            total={visibleItems.length}
            isSelected={selectedId === item.id}
            onSelect={() => setSelectedId(item.id)}
            onDeselect={() => setSelectedId(null)}
            onOpen={() => markOpened(item.id)}
            onQuiet={() => quiet(item.id, 4)}
            onPin={() => item.signals.isPinned ? unpin(item.id) : pin(item.id)}
            onRemove={() => remove(item.id)}
          />
        ))}

        {/* Empty state */}
        {visibleItems.length === 0 && (
          <div className="orbit-empty">
            <p>Nothing in orbit yet.</p>
            <p className="orbit-hint">Add something below.</p>
          </div>
        )}
      </div>

      {/* Add input */}
      <form className="orbit-add" onSubmit={handleAdd}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add to orbit..."
          className="orbit-input"
        />
      </form>
    </div>
  );
}

function OrbitItem({
  item,
  index,
  total,
  isSelected,
  onSelect,
  onDeselect,
  onOpen,
  onQuiet,
  onPin,
  onRemove,
}) {
  // Position items in a circle around center
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 120; // px from center
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  // Opacity based on score (closer = more opaque)
  const opacity = 0.5 + item.computed.score * 0.5;

  return (
    <div
      className={`orbit-item ${isSelected ? 'selected' : ''} ${item.signals.isPinned ? 'pinned' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        opacity,
      }}
      onClick={isSelected ? undefined : onSelect}
    >
      <div className="orbit-item-dot" />

      {/* Title shown on hover or when selected */}
      <div className="orbit-item-label">
        {item.title}
      </div>

      {/* Actions shown when selected */}
      {isSelected && (
        <div className="orbit-item-actions">
          <button onClick={onOpen} title="Acknowledge">
            <span>Got it</span>
          </button>
          <button onClick={onQuiet} title="Quiet for a while">
            <span>Later</span>
          </button>
          <button onClick={onPin} title={item.signals.isPinned ? 'Unpin' : 'Pin'}>
            <span>{item.signals.isPinned ? 'Unpin' : 'Pin'}</span>
          </button>
          <button onClick={onRemove} className="danger" title="Remove">
            <span>Remove</span>
          </button>
          <button onClick={onDeselect} className="close" title="Close">
            <span>x</span>
          </button>
        </div>
      )}

      {/* Score indicator (debug - can remove) */}
      {item.computed.reasons?.length > 0 && isSelected && (
        <div className="orbit-item-reasons">
          {item.computed.reasons.slice(0, 2).join(' / ')}
        </div>
      )}
    </div>
  );
}
