// ── Time formatting ───────────────────────────────────────────────
export function fmt(totalSeconds) {
  const h   = Math.floor(totalSeconds / 3600);
  const m   = Math.floor((totalSeconds % 3600) / 60);
  const sec = Math.floor(totalSeconds % 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function fmtMs(ms) {
  const m  = Math.floor(ms / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

export function pad(n) { return String(n).padStart(2, '0'); }

export function now() { return Date.now(); }

// ── SVG ring progress ─────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 104;

export function setRing(prog, glow, pct) {
  const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, pct)));
  prog.style.strokeDashoffset = offset;
  glow.style.strokeDashoffset = offset;
}

// ── Ring + wrap colour states ─────────────────────────────────────
const STATE_COLORS = {
  idle:    'var(--glass-border)',
  running: 'var(--accent)',
  paused:  'var(--warning)',
  done:    'var(--success)',
};

export function setWrapState(wrap, state) {
  wrap.className = wrap.className.replace(/timer-state-\w+/, '');
  wrap.classList.add('timer-state-' + state);
  const col = STATE_COLORS[state];
  wrap.querySelectorAll('.ring-prog').forEach(r => r.style.stroke = col);
  wrap.querySelectorAll('.ring-glow').forEach(r => r.style.stroke = col);
}

// ── Play / pause icon swap ────────────────────────────────────────
export function setPlayBtn(icon, playing) {
  icon.outerHTML = playing
    ? `<svg id="${icon.id}" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg id="${icon.id}" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
}

// ── Toast ─────────────────────────────────────────────────────────
export function toast(msg, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  const el   = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── HTML escaping ─────────────────────────────────────────────────
export function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}