# Orbit Development Log

> A context-aware attention surface

---

## Project Overview

**Orbit** is a personal attention management tool that surfaces the right things at the right time. Unlike traditional task managers that show everything at once, Orbit uses contextual signals (time, place, patterns) to intelligently float the most relevant items to your attention.

### Core Philosophy
- **5 Things Rule**: Only 3-5 items surface at any time from an unlimited orbit
- **Context-Aware**: Items know when and where they belong
- **Minimal Friction**: Focused on surfacing, not organizing
- **Immersive Experience**: Spatial audio, smooth animations, thoughtful design

---

## Architecture

### Directory Structure
```
orbit/
├── public/
│   ├── sounds/                    # Audio assets
│   │   ├── 17640 futuristic prompt-full.mp3   # New item SFX
│   │   ├── Futuristic Feature Select.mp3      # Mark done SFX
│   │   ├── Futuristic Power Generation.wav    # Reminder SFX
│   │   ├── Futuristic Reveal.wav              # Mode switch SFX
│   │   └── Space Ambience.mp3                 # Background ambient
│   ├── sw.js                      # Service worker for offline
│   └── index.html
├── src/
│   ├── components/
│   │   ├── OrbitSurface.js        # Main container component
│   │   ├── OrbitSurface.css       # All styles (700+ lines)
│   │   ├── OrbitItem.js           # Individual orbiting items
│   │   ├── OrbitInput.js          # Text input for adding items
│   │   ├── MusicToggle.js         # Ambient audio control
│   │   ├── ModeSelector.js        # Home/Work/Custom modes
│   │   ├── Walkthrough.js         # First-time user onboarding
│   │   └── ErrorBoundary.js       # Graceful error handling
│   ├── config/
│   │   └── constants.ts           # Central configuration
│   ├── engine/
│   │   ├── types.ts               # TypeScript type definitions
│   │   ├── score.js               # Contextual scoring algorithm
│   │   ├── rank.js                # Item ranking and selection
│   │   ├── stateMachine.ts        # Item lifecycle states
│   │   ├── histogramUtils.ts      # Pattern learning compression
│   │   └── __tests__/             # 44 unit tests
│   ├── hooks/
│   │   ├── useAudio.js            # Audio system with 8D spatial
│   │   └── useKeyboardNav.ts      # Accessibility navigation
│   ├── services/
│   │   ├── indexedDB.ts           # IndexedDB with fallback
│   │   ├── storage.js             # localStorage persistence
│   │   └── serviceWorker.ts       # Offline support
│   ├── store/
│   │   └── orbitStore.js          # State management
│   ├── index.tsx                  # Entry point
│   ├── App.tsx                    # Root component
│   └── declarations.d.ts          # Type declarations
├── tsconfig.json                  # TypeScript config
├── webpack.config.js              # Build config
├── babel.config.js                # Transpilation
└── package.json
```

---

## Features Implemented

### 1. Context-Aware Scoring Engine
**Files**: `src/engine/score.js`, `src/engine/rank.js`

The scoring algorithm weighs multiple signals:
| Signal    | Weight | Description |
|-----------|--------|-------------|
| Time      | 20%    | Hour-of-day pattern matching |
| Place     | 15%    | Location context (home/work) |
| Device    | 10%    | Device type matching |
| Recency   | 25%    | How recently accessed |
| Frequency | 15%    | How often accessed |
| Pinned    | 10%    | User-pinned priority |
| Novelty   | 5%     | Boost for new items |

### 2. Item Lifecycle State Machine
**File**: `src/engine/stateMachine.ts`

Items transition through states:
```
new → active → quieted → decaying → archived
     ↑         ↓
     └─────────┘
```

- **new**: First 24 hours, novelty boost
- **active**: Normal state, being scored
- **quieted**: Temporarily suppressed (user action)
- **decaying**: Ignored too often, fading
- **archived**: Removed from orbit

### 3. Visual Design
**Files**: `src/components/OrbitSurface.css`, `src/components/OrbitItem.js`

**Color Palette**:
- Center Planet: Deep Blue (#1e40af)
- Orbiting Items: Bioluminescent Teal (#00E5FF)
- Pinned Items: Soft Starlight Gold (#FFD54F)

**Visual Effects**:
- Age-based growth (16px → 24px over 7 days)
- Debris rings for older items
- Score-based proximity (closer = more relevant)
- Smooth drift animation (100s orbit cycle)

### 4. Audio System with Spatial Effects
**File**: `src/hooks/useAudio.js`

| Action          | Sound File                          |
|-----------------|-------------------------------------|
| Add new item    | `17640 futuristic prompt-full.mp3`  |
| Switch mode     | `Futuristic Reveal.wav`             |
| Mark done       | `Futuristic Feature Select.mp3`     |
| Reminder        | `Futuristic Power Generation.wav`   |
| Background      | `Space Ambience.mp3` (8D spatial)   |

**8D Spatial Audio**:
- Web Audio API stereo panning
- Slow oscillating pan (left ↔ right)
- Low-pass filter modulation for depth
- Immersive, stimulating ambient feel

### 5. Mode System
**File**: `src/components/ModeSelector.js`

- Default modes: Home, Work
- Custom modes via + button
- Dramatic transition animation on switch
- Items filtered by mode context
- Modes persist in localStorage

### 6. Reminder System
**File**: `src/components/OrbitSurface.js`

- Items older than 4 hours trigger reminders
- Maximum one reminder per 3 hours
- Expands item and plays attention sound
- Toast notification with item title
- Prevents reminder fatigue

### 7. First-Time Walkthrough
**File**: `src/components/Walkthrough.js`

6-step onboarding sequence:
1. Welcome - introduces concept
2. Add Items - how to create
3. Smart Surfacing - explains scoring
4. Switch Modes - context switching
5. Take Action - item interactions
6. Immerse Yourself - ambient audio

Features:
- Spotlight focus effect
- Keyboard navigation (Enter/Escape)
- Skip option
- Progress dots
- Persists completion in localStorage

### 8. Accessibility
**File**: `src/hooks/useKeyboardNav.ts`, CSS

- Full keyboard navigation
- Focus visible indicators
- Skip link for screen readers
- High contrast mode support
- Reduced motion preference
- ARIA labels and roles

### 9. Offline Support
**Files**: `public/sw.js`, `src/services/serviceWorker.ts`

- Service worker with cache-first strategy
- Stale-while-revalidate for dynamic content
- IndexedDB for robust storage
- localStorage fallback
- Migration from localStorage → IndexedDB

---

## Configuration

### Constants (`src/config/constants.ts`)

```typescript
// Scoring weights
SCORING_WEIGHTS = {
  TIME: 0.20,
  PLACE: 0.15,
  DEVICE: 0.10,
  RECENCY: 0.25,
  FREQUENCY: 0.15,
  PINNED: 0.10,
  NOVELTY: 0.05,
}

// Visual sizing
PLANET_SIZES = {
  CENTER: 42,
  DOT_MIN: 16,
  DOT_MAX: 24,
  DOT_GROWTH_DAYS: 7,
}

// Audio
AUDIO = {
  REMINDER_INTERVAL_MS: 3 * 60 * 60 * 1000,  // 3 hours
  REMINDER_AGE_HOURS: 4,
  IMMERSIVE: {
    PAN_SPEED: 0.0005,
    PAN_RANGE: 0.8,
    FILTER_FREQ: 800,
    FILTER_Q: 1.5,
  }
}
```

---

## Testing

**44 unit tests** covering:
- Score calculation
- Component weights
- Time pattern matching
- Recency decay
- Frequency normalization
- Novelty boost
- Pinned item handling
- Ranking algorithm
- Visible item selection
- Edge cases

Run with: `npm test`

---

## Build

**Development**: `npm start` (webpack-dev-server on localhost:3000)
**Production**: `npm run build` (outputs to dist/)

Current bundle size: ~255 KiB (room for code splitting optimization)

---

## Commits History

| Commit | Description |
|--------|-------------|
| V1 MVP | Bigger center, age-based growth, audio, branding |
| Architecture v1 | Config, components, tests |
| TypeScript | Entry points, config, types |
| Architecture v2 | State machine, storage, offline, accessibility |
| Style | Planet colors - teal orbits, gold pinned |
| Audio/UX | New SFX, modes, walkthrough, 8D spatial |

---

## Technical Decisions

### Why Not Three.js?
Initially prototyped with Three.js for 3D orbits, but:
- Felt "AI-ish" and over-engineered
- Added unnecessary complexity
- CSS animations provide smooth, performant orbits
- Simpler = more maintainable

### TypeScript Migration Strategy
Incremental adoption:
- Entry points and config in TypeScript
- Core engine files migrating gradually
- Type declarations for JS modules
- JSDoc comments for type hints

### Histogram Compression
Pattern learning uses EMA (Exponential Moving Average):
- 0.95 decay factor preserves trends
- Rolling window prevents unbounded growth
- Efficient for real-time updates

---

## Future Considerations

1. **Code Splitting**: Lazy load walkthrough, audio system
2. **PWA**: Full progressive web app with install prompt
3. **Sync**: Optional cloud sync between devices
4. **AI Integration**: Natural language item parsing
5. **Calendar**: Time-block integration
6. **Widgets**: Desktop/mobile widgets

---

## File Quick Reference

| Need to... | Look at... |
|------------|------------|
| Change scoring weights | `src/config/constants.ts` |
| Modify visual styles | `src/components/OrbitSurface.css` |
| Add new SFX triggers | `src/hooks/useAudio.js` |
| Update walkthrough steps | `src/components/Walkthrough.js` |
| Change reminder timing | `src/config/constants.ts` → AUDIO |
| Add new mode features | `src/components/ModeSelector.js` |
| Modify item lifecycle | `src/engine/stateMachine.ts` |
| Update scoring logic | `src/engine/score.js` |
| Add keyboard shortcuts | `src/hooks/useKeyboardNav.ts` |
| Configure offline behavior | `public/sw.js` |

---

*Last updated: 23 December 2025*
