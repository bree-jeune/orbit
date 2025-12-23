import React, { useEffect, useState, useRef } from 'react';
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
  const [inputFocused, setInputFocused] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsub = subscribe(setState);
    initialize();
    startAutoRecompute();
    return () => {
      unsub();
      stopAutoRecompute();
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && !inputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setExpandedId(null);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inputFocused]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      addToOrbit(inputValue.trim());
      setInputValue('');
    }
  };

  const { visibleItems, context, isLoading } = state;

  if (isLoading) {
    return <div className="surface" />;
  }

  return (
    <div className="surface" onClick={() => setExpandedId(null)}>
      {/* Context indicator */}
      <div
        className="place"
        onClick={(e) => {
          e.stopPropagation();
          setPlace(context?.place === 'work' ? 'home' : 'work');
        }}
      >
        {context?.place === 'work' ? 'work' : 'home'}
      </div>

      {/* Orbit container */}
      <div className="orbit">
        {/* Center point */}
        <div className="center" />

        {/* Orbital rings (visual only) */}
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />

        {/* Items in orbit */}
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
        {visibleItems.length === 0 && (
          <div className="empty">press / to add</div>
        )}
      </div>

      {/* Input */}
      <form className="add" onSubmit={handleAdd} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="/"
          spellCheck={false}
        />
      </form>
    </div>
  );
}

function OrbitItem({
  item,
  index,
  total,
  isExpanded,
  onExpand,
  onAcknowledge,
  onQuiet,
  onPin,
  onRemove,
}) {
  // Position in orbit - spread evenly around circle
  const baseAngle = (index / Math.max(total, 1)) * 360;
  // Distance from center based on score (higher score = closer)
  const distance = 80 + (1 - item.computed.score) * 60;

  return (
    <div
      className={`item ${isExpanded ? 'expanded' : ''} ${item.signals.isPinned ? 'pinned' : ''}`}
      style={{
        '--angle': `${baseAngle}deg`,
        '--distance': `${distance}px`,
        '--opacity': 0.5 + item.computed.score * 0.5,
      }}
      onClick={onExpand}
    >
      <div className="item-dot" />
      <div className="item-label">{item.title}</div>

      {isExpanded && (
        <div className="item-actions">
          <button onClick={(e) => { e.stopPropagation(); onAcknowledge(); }} title="Done">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onQuiet(); }} title="Later">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm7-3.25v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5a.75.75 0 011.5 0z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onPin(); }} title={item.signals.isPinned ? 'Unpin' : 'Pin'} className={item.signals.isPinned ? 'active' : ''}>
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.456.734a1.75 1.75 0 012.826.504l.613 1.327a3.08 3.08 0 002.084 1.707l2.454.584c1.332.317 1.8 1.972.832 2.94L11.06 10l3.72 3.72a.75.75 0 11-1.06 1.06L10 11.06l-2.204 2.205c-.968.968-2.623.5-2.94-.832l-.584-2.454a3.08 3.08 0 00-1.707-2.084l-1.327-.613a1.75 1.75 0 01-.504-2.826L4.456.734z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove" className="danger">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
