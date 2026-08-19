# Changelog

All notable changes to Chronos are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] — Project files & tooling

### Added
- `directory.txt` — fully annotated project map with data-flow diagrams
- `.gitignore` — covers Node, OS, editor, and build artefacts
- `.env.example` — documents all required environment variables
- `package.json` — project metadata and npm scripts (`start`, `dev`, `serve`, `lint`, `fmt`, `check`)
- `.editorconfig` — consistent indent / line-ending rules across editors
- `.prettierrc` — Prettier formatting config
- `eslint.config.js` — ESLint flat config (v9+) with browser globals and recommended rules

---

## [1.1.0] — AI Focus Coach (Gemini)

### Added
- **`js/coach.js`** — Gemini 1.5 Flash API engine
  - `callGemini()` — REST call to `generativelanguage.googleapis.com`
  - `buildUserContext()` — injects real user data (history, saved timers, Pomodoro config) into every system prompt
  - `sendMessage()` — manages chat turn history, converts `assistant` → `model` role for Gemini
  - `getSessionSuggestion()` — context-aware greeting / post-session message
  - Word-by-word simulated streaming via `onChunk` callback
  - `QUICK_PROMPTS[]` — 5 pre-written conversation starters
- **`js/coachUI.js`** — Chat interface controller
  - Streaming chat rendering with typing indicator animation
  - Session plan auto-extraction from AI replies (regex time-mention parser)
  - Clickable plan items that navigate to dashboard and start the timer
  - Quick-prompt buttons
  - Auto-growing textarea (`Shift+Enter` for newline, `Enter` to send)
- **`css/coach.css`** — Full coach UI styling
  - Two-column layout (chat panel + side panel)
  - Message bubbles (user right-aligned, coach left-aligned)
  - Typing dots animation
  - Online indicator pulse
  - Session plan panel with start button
  - Responsive: single-column on narrow viewports
- **`proxy-server.js`** — Node.js dev server
  - Serves static files
  - Proxies `/gemini/*` → Google Generative Language API with key injected server-side
  - Reads `GEMINI_API_KEY` from environment

### Changed
- `js/nav.js` — lazy-imports `coachUI.js` on first coach view open to avoid circular deps
- `js/app.js` — exposes coach functions on `window.App`
- `index.html` — added AI Coach nav item (sidebar + mobile), coach view markup, `coach.css` link

---

## [1.0.0] — Initial release

### Added
- **`index.html`** — single-page app shell, markup only
- **`css/base.css`** — CSS custom properties, reset, layout, shared components (buttons, cards, forms, kbd hints)
- **`css/nav.css`** — fixed sidebar (desktop) + bottom navigation bar (mobile)
- **`css/timer.css`** — SVG circular progress ring, timer controls, preset buttons, saved timer cards
- **`css/views.css`** — all view-specific styles: dashboard, Pomodoro, stopwatch, history, settings
- **`css/overlays.css`** — modal, completion overlay, toast notification stack

- **`js/state.js`** — centralised state + `localStorage` persistence
  - Runtime: `dashState`, `pomoState`, `swState`
  - Persisted: `settings`, `savedTimers`, `historyData`, `pomoConfig`
  - Helpers: `save()`, `load()`, `saveAll()`
- **`js/utils.js`** — pure helpers: `fmt`, `fmtMs`, `pad`, `setRing`, `setWrapState`, `setPlayBtn`, `toast`, `escHtml`
- **`js/audio.js`** — Web Audio API synthesiser (bell, chime, pulse, soft) — no audio files needed; browser notification wrapper
- **`js/nav.js`** — view router with per-view init hooks
- **`js/keyboard.js`** — `Space`, `R`, `L`, `1–7` shortcuts

- **`js/dashboard.js`** — Quick timer
  - Timestamp-based countdown (accurate even when tab is backgrounded)
  - Start / pause / reset / +1 minute
  - Preset selection (1, 5, 10, 25, 30, 45, 60 min)
  - Completion overlay with restart option
  - Writes to history on completion

- **`js/pomodoro.js`** — Pomodoro engine
  - Focus / short break / long break modes
  - Configurable durations (adjusted live without resetting)
  - Auto-advance between phases
  - Optional auto-start after each phase
  - Session dot indicator

- **`js/stopwatch.js`** — Stopwatch
  - 50 ms tick interval, `MM:SS.cs` display
  - Lap recording with best (green) / worst (red) highlights
  - Summary: best lap, average lap, total laps

- **`js/timers.js`** — Saved timers
  - Create, edit, delete, render
  - Start any saved timer directly on the dashboard

- **`js/history.js`** — Session history
  - Stores up to 200 entries in localStorage
  - Weekly bar chart (last 7 days, hours per day)
  - Session breakdown: total, average, longest, count
  - `updateStats()` refreshes dashboard stat cards

- **`js/settings.js`** — Settings
  - 5 accent colour options (CSS variable swap)
  - Sound / notification / auto-start toggles
  - Volume slider (0–100)
  - 4 notification sound types with preview
  - Browser notification permission request

- **`js/app.js`** — Entry point
  - Boots all modules in correct order
  - Exposes `window.App` for HTML `onclick=` attributes
  - Attaches modal backdrop click-to-close

- **`README.md`** — Full documentation
  - Feature list, project structure, getting started (with and without AI), technical notes, browser support, roadmap
