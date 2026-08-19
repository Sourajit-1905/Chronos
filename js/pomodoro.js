import { pomoState, pomoConfig, save } from './state.js';
import { fmt, setRing, setWrapState, setPlayBtn, toast, now } from './utils.js';
import { playSound, sendNotif } from './audio.js';
import { addHistory } from './dashboard.js';
import { settings } from './state.js';

// ── DOM refs ──────────────────────────────────────────────────────
const prog     = () => document.getElementById('pomo-ring-prog');
const glow     = () => document.getElementById('pomo-ring-glow');
const disp     = () => document.getElementById('pomo-disp');
const label    = () => document.getElementById('pomo-label');
const subLabel = () => document.getElementById('pomo-session-label');
const wrap     = () => document.getElementById('pomo-ring-wrap');
const playIcon = () => document.getElementById('pomo-play-icon');

const MODE_LABELS = { focus: 'FOCUS', short: 'SHORT BREAK', long: 'LONG BREAK' };

let tick = null;

// ── Duration lookup ───────────────────────────────────────────────
function duration(mode) {
  if (mode === 'focus') return pomoConfig.focus * 60;
  if (mode === 'short') return pomoConfig.short * 60;
  return pomoConfig.long * 60;
}

// ── Mode switch ───────────────────────────────────────────────────
export function setPomoMode(mode) {
  if (pomoState.running) pomoReset();
  pomoState.mode      = mode;
  pomoState.remaining = duration(mode);
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('pomo-btn-' + mode).classList.add('active');
  updateDisplay();
}

// ── Toggle start / pause ──────────────────────────────────────────
export function togglePomo() {
  if (pomoState.remaining <= 0) { advance(); return; }
  pomoState.running ? pausePomo() : startPomo();
}

function startPomo() {
  pomoState.running = true;
  pomoState.endAt   = now() + pomoState.remaining * 1000;
  setPlayBtn(playIcon(), true);
  setWrapState(wrap(), 'running');
  tick = setInterval(tickFn, 200);
}

function pausePomo() {
  pomoState.running   = false;
  pomoState.remaining = Math.max(0, Math.round((pomoState.endAt - now()) / 1000));
  clearInterval(tick);
  setPlayBtn(playIcon(), false);
  setWrapState(wrap(), 'paused');
}

export function pomoReset() {
  pomoState.running   = false;
  pomoState.remaining = duration(pomoState.mode);
  clearInterval(tick);
  setPlayBtn(playIcon(), false);
  setWrapState(wrap(), 'idle');
  updateDisplay();
}

export function pomoSkip() { advance(); }

function advance() {
  pomoState.running = false;
  clearInterval(tick);

  if (pomoState.mode === 'focus') {
    addHistory('Pomodoro focus', pomoConfig.focus * 60);
    if (pomoState.session >= pomoConfig.sessions) {
      pomoState.session = 1;
      setPomoMode('long');
    } else {
      pomoState.session++;
      setPomoMode('short');
    }
  } else {
    setPomoMode('focus');
  }

  if (settings.autostart) setTimeout(startPomo, 800);
}

function tickFn() {
  const rem = Math.max(0, Math.round((pomoState.endAt - now()) / 1000));
  pomoState.remaining = rem;
  updateDisplay();
  if (rem <= 0) { clearInterval(tick); pomoState.running = false; complete(); }
}

function complete() {
  setWrapState(wrap(), 'done');
  playSound('chime');
  const msg = pomoState.mode === 'focus' ? 'Focus session done!' : 'Break is over!';
  toast(msg, 'info');
  sendNotif(msg, '');
  advance();
}

// ── Config adjustment ─────────────────────────────────────────────
export function adjustPomo(type, delta) {
  const bounds = { focus: [5, 90], short: [1, 30], long: [5, 60] };
  const [min, max] = bounds[type];
  pomoConfig[type] = Math.max(min, Math.min(max, pomoConfig[type] + delta));
  document.getElementById('pomo-settings-' + type).textContent = pomoConfig[type];
  save('pomoConfig', pomoConfig);
  if (pomoState.mode === type && !pomoState.running) {
    pomoState.remaining = pomoConfig[type] * 60;
    updateDisplay();
  }
}

// ── Display ───────────────────────────────────────────────────────
function updateDisplay() {
  const total = duration(pomoState.mode);
  disp().textContent     = fmt(pomoState.remaining);
  subLabel().textContent = `Session ${pomoState.session} of ${pomoConfig.sessions}`;
  label().textContent    = MODE_LABELS[pomoState.mode];
  setRing(prog(), glow(), pomoState.remaining / total);
  renderDots();
}

function renderDots() {
  const container = document.getElementById('pomo-dots');
  container.innerHTML = '';
  for (let i = 1; i <= pomoConfig.sessions; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot';
    if (i <  pomoState.session) dot.classList.add('done');
    if (i === pomoState.session) dot.classList.add('current');
    container.appendChild(dot);
  }
}

// ── Init ──────────────────────────────────────────────────────────
export function initPomodoro() {
  updateDisplay();
  setRing(prog(), glow(), 1);
}