import { dashState, saveAll, historyData, setHistoryData } from './state.js';
import { fmt, setRing, setWrapState, setPlayBtn, toast, now } from './utils.js';
import { playSound, sendNotif } from './audio.js';
import { updateStats } from './history.js';

// ── DOM refs ──────────────────────────────────────────────────────
const prog      = () => document.getElementById('dash-ring-prog');
const glow      = () => document.getElementById('dash-ring-glow');
const disp      = () => document.getElementById('dash-timer-disp');
const label     = () => document.getElementById('dash-timer-label');
const sub       = () => document.getElementById('dash-timer-sub');
const wrap      = () => document.getElementById('dash-ring-wrap');
const playIcon  = () => document.getElementById('dash-play-icon');

let tick = null;

// ── Preset selection ──────────────────────────────────────────────
export function setDashPreset(minutes) {
  if (dashState.running) return;
  dashState.total     = minutes * 60;
  dashState.remaining = minutes * 60;
  document.querySelectorAll('#view-dashboard .presets .preset-btn')
    .forEach(b => b.classList.toggle('sel', b.textContent === minutes + 'm'));
  updateDisplay();
}

// ── Start / pause toggle ──────────────────────────────────────────
export function toggleDashTimer() {
  if (dashState.remaining <= 0) { reset(); return; }
  dashState.running ? pause() : start();
}

function start() {
  dashState.running = true;
  dashState.endAt   = now() + dashState.remaining * 1000;
  label().textContent = 'RUNNING';
  setPlayBtn(playIcon(), true);
  setWrapState(wrap(), 'running');
  tick = setInterval(tickFn, 200);
}

function pause() {
  dashState.running  = false;
  dashState.remaining = Math.max(0, Math.round((dashState.endAt - now()) / 1000));
  clearInterval(tick);
  label().textContent = 'PAUSED';
  setPlayBtn(playIcon(), false);
  setWrapState(wrap(), 'paused');
}

export function reset() {
  dashState.running   = false;
  dashState.remaining = dashState.total;
  clearInterval(tick);
  label().textContent = 'READY';
  sub().textContent   = 'Select a preset';
  setPlayBtn(playIcon(), false);
  setWrapState(wrap(), 'idle');
  updateDisplay();
}

export function addMinute() {
  dashState.remaining = Math.min(dashState.remaining + 60, 99 * 60 + 59);
  dashState.total     = Math.max(dashState.total, dashState.remaining);
  if (dashState.running) dashState.endAt = now() + dashState.remaining * 1000;
  updateDisplay();
  toast('+1:00 added', 'info');
}

function tickFn() {
  const rem = Math.max(0, Math.round((dashState.endAt - now()) / 1000));
  dashState.remaining = rem;
  updateDisplay();
  if (rem <= 0) { clearInterval(tick); dashState.running = false; complete(); }
}

function updateDisplay() {
  disp().textContent = fmt(dashState.remaining);
  setRing(prog(), glow(), dashState.remaining / dashState.total);
}

function complete() {
  setWrapState(wrap(), 'done');
  label().textContent = 'DONE';
  playSound('bell');
  addHistory('Focus session', dashState.total);
  showCompletion('Session complete!', 'Time to take a short break.');
}

// ── History helper ────────────────────────────────────────────────
export function addHistory(name, duration) {
  historyData.unshift({ name, duration, at: Date.now() });
  if (historyData.length > 200) setHistoryData(historyData.slice(0, 200));
  saveAll();
  updateStats();
}

// ── Completion overlay ────────────────────────────────────────────
let lastTotal = null;

function showCompletion(title, msg) {
  document.getElementById('completion-title').textContent = title;
  document.getElementById('completion-msg').textContent   = msg;
  document.getElementById('completion-overlay').classList.add('show');
  lastTotal = dashState.total;
  sendNotif(title, msg);
}

export function closeCompletion() {
  document.getElementById('completion-overlay').classList.remove('show');
}

export function restartFromCompletion() {
  closeCompletion();
  dashState.remaining = lastTotal || dashState.total;
  updateDisplay();
  setWrapState(wrap(), 'idle');
  setTimeout(start, 200);
}

// ── Init ──────────────────────────────────────────────────────────
export function initDashboard() {
  updateDisplay();
  setRing(prog(), glow(), 1);
}