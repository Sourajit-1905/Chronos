# Contributing to Chronos

Thanks for your interest in contributing! This document explains how the project is structured and how to get changes in cleanly.

---

## Getting started

```bash
git clone https://github.com/you/chronos.git
cd chronos
cp .env.example .env        # add your GEMINI_API_KEY
node proxy-server.js        # open http://localhost:3000
```

No build step. No `npm install`. Edit files, refresh the browser.

---

## Project conventions

### Code style
- **Prettier** handles formatting. Run `npm run fmt` before committing.
- **ESLint** handles logic. Run `npm run lint` to check.
- 2-space indent, single quotes, no semicolons at end of blocks (Prettier enforces this).
- `.editorconfig` keeps line endings and trailing whitespace consistent — install the EditorConfig plugin for your editor.

### JavaScript
- All JS files are **ES Modules** (`import` / `export`). No CommonJS.
- No TypeScript, no JSX, no transpiler — what you write is what runs.
- Keep modules focused on a single concern. The current split is:

  | Module | Responsibility |
  |---|---|
  | `state.js` | Data only — no DOM |
  | `utils.js` | Pure functions only — no DOM, no state |
  | `audio.js` | Web Audio + Notification API only |
  | `nav.js` | Routing only |
  | `keyboard.js` | Keyboard only |
  | `*.js` (features) | One feature per file |

- Avoid importing `coachUI.js` or `coach.js` directly from feature modules — use lazy `import()` inside `nav.js` to keep the AI layer optional and avoid circular dependencies.
- All persistent data must go through `state.js` → `saveAll()`.

### CSS
- One stylesheet per concern (base, nav, timer, views, overlays, coach).
- Use CSS custom properties (`var(--accent)`) for all colours — never hard-code hex values inside rules.
- Mobile styles go inside `@media (max-width: 768px)` blocks at the bottom of each file.
- Don't add `!important` except inside the `prefers-reduced-motion` block.

### HTML
- `index.html` is markup only. No `<style>` blocks, no `<script>` blocks (except the single module entry point at the bottom).
- All user-facing strings should be readable without CSS.
- All interactive elements need accessible labels (use `title=` or `aria-label=` on icon-only buttons).

---

## Making changes

### Bug fix
1. Identify which module owns the behaviour.
2. Fix it, run `npm run lint`, refresh the browser.
3. Open a PR with a short description of what was wrong and what you changed.

### New feature
1. Discuss in an issue first if it's non-trivial.
2. Add styles to the most appropriate existing stylesheet, or create a new `css/feature.css`.
3. Add logic to the most appropriate existing module, or create a new `js/feature.js`.
4. If the feature needs a new view, add it to `index.html` and register it in `nav.js`.
5. Expose any new functions on `window.App` in `app.js`.
6. Update `CHANGELOG.md` under an `[Unreleased]` section.
7. Update `directory.txt` if you added files.

### Changing the AI provider
The AI layer is isolated to `js/coach.js` and `proxy-server.js`.
- `coach.js` owns the API call format and chat history management.
- `proxy-server.js` owns the key injection and request forwarding.
- `coachUI.js` is provider-agnostic — it just calls `sendMessage()`.

To switch providers, replace only those two files.

---

## Commit messages

Use the format: `type: short description`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `style` | CSS / visual changes with no logic change |
| `refactor` | Code restructure with no behaviour change |
| `docs` | README, CHANGELOG, comments |
| `chore` | Config files, tooling, .gitignore |

Examples:
```
feat: add dark/light theme toggle
fix: timer drift when tab is backgrounded
style: increase contrast on session dot indicators
docs: add proxy setup instructions to README
```

---

## Pull request checklist

- [ ] `npm run lint` passes
- [ ] `npm run fmt` has been run
- [ ] Tested in Chrome and Firefox
- [ ] Mobile layout checked (DevTools responsive mode)
- [ ] `CHANGELOG.md` updated
- [ ] `directory.txt` updated if files were added or removed
