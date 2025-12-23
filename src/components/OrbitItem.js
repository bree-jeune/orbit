/**
 * OrbitItem Component
 *
 * Individual orbiting item with age-based growth,
 * hover effects, and action buttons.
 */

import React, { useState } from 'react';
import {
  PLANET_SIZES,
  ORBIT_RADII,
  DEBRIS_RINGS,
} from '../config/constants.js';

export default function OrbitItem({
  item,
  index,
  total,
  isExpanded,
  onExpand,
  onAcknowledge,
  onQuiet,
  onPin,
  onRemove,
  onHover,
  onClick,
}) {
  const [hovered, setHovered] = useState(false);

  // Spread items around center
  const angle = (index / Math.max(total, 1)) * 360 + (item.id.charCodeAt(0) % 20);

  // Distance from center - higher score = closer
  const baseDistance =
    ORBIT_RADII.MIN_DISTANCE + (1 - item.computed.score) * ORBIT_RADII.DISTANCE_RANGE;

  // Opacity = relevance
  const opacity = 0.4 + item.computed.score * 0.6;

  // Age-based growth: items grow over time
  const createdAt = new Date(item.signals.createdAt).getTime();
  const now = Date.now();
  const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  // Dot grows from min to max over growth period
  const growthProgress = Math.min(1, ageDays / PLANET_SIZES.DOT_GROWTH_DAYS);
  const dotSize =
    PLANET_SIZES.DOT_MIN +
    growthProgress * (PLANET_SIZES.DOT_MAX - PLANET_SIZES.DOT_MIN);

  // Rings appear after threshold, grow more visible over time
  const ringAge = Math.max(0, ageDays - DEBRIS_RINGS.APPEAR_AFTER_DAYS);
  const ringSize = Math.min(DEBRIS_RINGS.MAX_SIZE, ringAge * DEBRIS_RINGS.GROWTH_RATE);
  const ringOpacity = Math.min(DEBRIS_RINGS.MAX_OPACITY, ringAge * DEBRIS_RINGS.OPACITY_RATE);

  const handleMouseEnter = () => {
    setHovered(true);
    onHover?.();
  };

  const handleClick = (e) => {
    onClick?.();
    onExpand(e);
  };

  return (
    <div
      className={`item ${hovered ? 'hovered' : ''} ${isExpanded ? 'expanded' : ''} ${item.signals.isPinned ? 'pinned' : ''}`}
      style={{
        '--angle': `${angle}deg`,
        '--distance': `${baseDistance}px`,
        '--opacity': opacity,
        '--delay': `${-(item.id.charCodeAt(0) % 80)}s`,
        '--dot-size': `${dotSize}px`,
        '--ring-size': `${ringSize}px`,
        '--ring-opacity': ringOpacity,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="dot" />

      {/* Label - shows on hover */}
      <div className={`label ${hovered || isExpanded ? 'visible' : ''}`}>
        {item.title}
      </div>

      {/* Action buttons - show when expanded */}
      {isExpanded && (
        <div className="actions">
          <button onClick={(e) => { e.stopPropagation(); onAcknowledge(); }} title="Got it">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onQuiet(); }} title="Later">
            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm7-3.25v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5a.75.75 0 011.5 0z"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            title={item.signals.isPinned ? 'Unpin' : 'Pin'}
            className={item.signals.isPinned ? 'active' : ''}
          >
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
