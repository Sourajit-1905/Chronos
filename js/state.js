// ── Persistence ───────────────────────────────────────────────────
export function save(key, value) {
  try { localStorage.setItem('chronos_' + key, JSON.stringify(value)); } catch (e) {}
}

export function load(key) {
  try { const v = localStorage.getItem('chronos_' + key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}

// ── Global app state ──────────────────────────────────────────────
export const settings = load('settings') || {
  sound:     true,
  notif:     false,
  autostart: false,
  accent:    '#6c8ef5',
  accent2:   '#8b5cf6',
  volume:    60,
};

export let savedTimers = load('timers')   || [];
export let historyData = load('history')  || [];
export const pomoConfig = load('pomoConfig') || { focus: 25, short: 5, long: 15, sessions: 4 };

export function saveAll() {
  save('settings',   settings);
  save('timers',     savedTimers);
  save('history',    historyData);
  save('pomoConfig', pomoConfig);
}

export function setSavedTimers(arr) { savedTimers = arr; }
export function setHistoryData(arr) { historyData = arr; }

// ── Dashboard timer state ─────────────────────────────────────────
export const dashState = { total: 25 * 60, remaining: 25 * 60, running: false, endAt: null };

// ── Pomodoro state ────────────────────────────────────────────────
export const pomoState = { session: 1, mode: 'focus', running: false, endAt: null, remaining: 25 * 60 };

// ── Stopwatch state ───────────────────────────────────────────────
export const swState = { running: false, elapsed: 0, startAt: null, laps: [] };