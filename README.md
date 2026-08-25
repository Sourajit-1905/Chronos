# Chronos ⏱

A productivity timer app with a glassmorphic UI and an AI focus coach.
No frameworks, no build tools, no npm install — just HTML, CSS, and JavaScript.

**Live demo:** [https://chronos-e6r2.onrender.com/]

---

## What it does

- Countdown timer with circular progress ring and four states — idle, running, paused, done
- One-click presets (1m through 60m) plus custom hours/minutes/seconds input
- Pomodoro mode — focus, short break, long break, auto-advance between phases
- Stopwatch with lap tracking, best/worst lap highlighting, and summary stats
- Save and reuse timer configs — name them, edit them, start them in one click
- Session history stored locally — weekly bar chart, total time, averages
- AI focus coach — chat with Gemini about your session, ask it to plan your day, it responds based on your actual usage data not generic advice
- Settings — accent colour, sounds, volume, notification permission, auto-start toggle

---

## Stack

- Vanilla HTML, CSS, JavaScript (ES Modules)
- Google Gemini API for the AI coach
- Node.js proxy server — keeps the API key on the server, never in the browser
- Deployed on Render

---

## Project layout

See [`directory.txt`](directory.txt) for the full annotated file map.

---

## Running locally

ES Modules don't work over `file://` so you need a local server.

**Without the AI coach:**
```bash
cd chronos
python3 -m http.server 8080
# open http://localhost:8080
```

**With the AI coach:**
```bash
# copy the env file and fill in your key
cp .env.example .env

# start the proxy server
node proxy-server.js
# open http://localhost:3000
```

- Get a free Gemini key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Free tier gives 1500 requests/day — more than enough for personal use
- Your `.env` needs: `GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT`

---

## Deploying to Render

**1. Push to GitHub**
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourname/chronos.git
git push -u origin main
```
- Run `git status` before pushing — confirm `.env` is not in the list

**2. Create a Web Service on Render**

- Go to [dashboard.render.com](https://dashboard.render.com) → New → Web Service → connect your repo
- Build Command: `echo 'No build step needed'`
- Start Command: `node proxy-server.js`
- Instance Type: Free

**3. Add environment variables in the Render dashboard**

- `GEMINI_API_KEY` → your actual key
- `GEMINI_MODEL` → `gemini-3.6-flash`
- `NODE_ENV` → `production`
- Don't add `PORT` — Render sets it automatically

**4. After deploy — lock down CORS**

- Copy your Render URL once it's live
- Add one more env var: `ALLOWED_ORIGIN` → `https://your-app.onrender.com`
- Render auto-redeploys — stops your key being used from other sites

> Free tier spins down after 15 minutes of inactivity. First request after that takes ~30 seconds to wake up.

---

## How things work

- **Timer accuracy** — stores a target timestamp on start, recalculates remaining time each tick instead of decrementing a counter, stays accurate when the tab is backgrounded
- **Audio** — all sounds generated with Web Audio API at runtime, no audio files shipped, four types: bell, chime, pulse, soft
- **AI context** — coach gets your total focus time, session count, average session length, saved timers, and Pomodoro config on every request so its advice is based on what you actually do
- **API key safety** — key lives in a server environment variable, browser never sees it, proxy rate-limits to 20 requests per IP per minute
- **Data storage** — everything in `localStorage` under `chronos_*` keys, nothing sent to any server except AI chat messages

---

## Keyboard shortcuts

- `Space` — start / pause
- `R` — reset
- `L` — lap (stopwatch only)
- `1` through `7` — quick presets: 1m, 5m, 10m, 15m, 25m, 30m, 45m

---

## Browser support

- Works in any modern browser
- `backdrop-filter` (frosted glass) not supported in Firefox by default — everything else works fine
- Web Audio API needs a user interaction before playing sounds — clicking start counts

---

## License

MIT
