import { swState } from './state.js';
import { fmtMs, pad, setPlayBtn, now } from './utils.js';

// ── DOM refs ──────────────────────────────────────────────────────
const disp    = () => document.getElementById('sw-disp');
const playIcon = () => document.getElementById('sw-play-icon');
const lapBtn  = () => document.getElementById('sw-lap-btn');

let tick = null;

// ── Toggle start / pause ──────────────────────────────────────────
export function toggleSW() {
  if (swState.running) {
    swState.running  = false;
    swState.elapsed += now() - swState.startAt;
    clearInterval(tick);
    setPlayBtn(playIcon(), false);
  } else {
    swState.running  = true;
    swState.startAt  = now();
    setPlayBtn(playIcon(), true);
    lapBtn().style.opacity = '1';
    lapBtn().style.cursor  = 'pointer';
    tick = setInterval(tickFn, 50);
  }
}

// ── Reset ─────────────────────────────────────────────────────────
export function swReset() {
  swState.running = false;
  swState.elapsed = 0;
  swState.laps    = [];
  clearInterval(tick);
  disp().textContent = '00:00.00';
  setPlayBtn(playIcon(), false);
  lapBtn().style.opacity = '0.4';
  lapBtn().style.cursor  = 'default';
  document.getElementById('sw-stats').style.display    = 'none';
  document.getElementById('sw-laps-card').style.display = 'none';
  document.getElementById('sw-lap-list').innerHTML      = '';
}

// ── Lap ───────────────────────────────────────────────────────────
export function swLap() {
  if (!swState.running) return;
  const total = swState.elapsed + (now() - swState.startAt);
  const prev  = swState.laps.length ? swState.laps[swState.laps.length - 1].total : 0;
  swState.laps.push({ total, lap: total - prev });
  renderLaps();
}

// ── Tick ──────────────────────────────────────────────────────────
function tickFn() {
  const total = swState.elapsed + (now() - swState.startAt);
  disp().textContent = fmtMs(total);
}

// ── Render lap list ───────────────────────────────────────────────
function renderLaps() {
  const list = document.getElementById('sw-lap-list');
  const laps = swState.laps;
  if (!laps.length) return;

  const times = laps.map(l => l.lap);
  const best  = Math.min(...times);
  const worst = Math.max(...times);
  const avg   = times.reduce((a, b) => a + b, 0) / times.length;

  list.innerHTML = laps.slice().reverse().map((l, ri) => {
    const i   = laps.length - 1 - ri;
    const cls = l.lap === best && laps.length > 1  ? 'lap-item best'
              : l.lap === worst && laps.length > 1 ? 'lap-item worst'
              : 'lap-item';
    return `<div class="${cls}">
      <span class="lap-num">LAP ${pad(i + 1)}</span>
      <span>${fmtMs(l.lap)}</span>
      <span style="color:var(--text3)">${fmtMs(l.total)}</span>
    </div>`;
  }).join('');

  document.getElementById('sw-best').textContent     = fmtMs(best);
  document.getElementById('sw-avg').textContent      = fmtMs(Math.round(avg));
  document.getElementById('sw-lapcount').textContent = laps.length;
  document.getElementById('sw-stats').style.display    = 'block';
  document.getElementById('sw-laps-card').style.display = 'block';
}