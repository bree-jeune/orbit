# 🪐 Orbit

Orbit is a context-aware attention *surface* designed to reduce the cost of re-orientation in a constantly interrupted world.

Modern tools are built for storage, organization, and retrieval.
Orbit is built for remembering what mattered, at the moment it matters.

Instead of asking users to manage tasks, categories, or priorities, Orbit maintains a rotating working set of the most relevant items based on context such as time, location, device, and interaction history.

Items never disappear. They simply move closer or farther away.

## ✨ Why Orbit Exists

Our attention is not hierarchical.
It’s situational.

We don’t forget because we’re disorganized, we forget because context changes.

Orbit was designed for moments like:

- “When I get home, I need to remember to do that thing.”
- “I know this mattered earlier… what was it?”
- “I’m back at work — what was I in the middle of?”

Orbit preserves mental continuity without demanding maintenance.

## 🔄 How It Works

- Users can add any number of items to their Orbit.
- At any moment, only a small set (typically 3–5 items) is surfaced.
- Items rotate based on contextual relevance:
  - time of day
  - location
  - device
  - recent interaction
- The system favors recognition over recall.
- There are no folders, no priorities, and no “completion” states.

Orbit doesn’t ask you to manage your attention.
It just instinctively rotates toward it.

## 🧠 Design Principles

- Context >>> categorization
- Rotation >>> navigation
- Recognition >>> recall

- No guilt, no streaks, no pressure
- One interaction, one outcome

If a feature increases cognitive load, it doesn’t belong.

## 📦 Current Form Factors

- Chrome New Tab (MVP)
- Widget / Glanceable Surface (planned)
- Watch Face / Ambient Intelligence Interface (exploration)

Each surface shares the same philosophy: *be present without being demanding*.

## Repo Structure

```
orbit/
├── src/
│   ├── engine/           # Core algorithm
│   │   ├── types.js      # Data models
│   │   ├── score.js      # Relevance scoring
│   │   └── rank.js       # Ranking + interactions
│   ├── store/            # State management
│   │   └── orbitStore.js
│   ├── services/         # Storage abstraction
│   │   └── storage.js
│   ├── components/       # UI components
│   │   ├── OrbitSurface.js
│   │   └── OrbitSurface.css
│   ├── App.js
│   ├── index.js
│   └── styles.css
├── extension/            # Chrome extension
│   └── manifest.json
├── public/
│   └── index.html
├── package.json
└── webpack.config.js
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Build Chrome extension
npm run build:extension
```

## Chrome Extension

1. Run `npm run build:extension`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/` folder

## Status

Orbit is an active experiment in human-centered system design, accessibility, and intentional engineering.

The goal is not productivity.
The goal is **orientation**.
