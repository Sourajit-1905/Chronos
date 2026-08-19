import { settings } from './state.js';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// ── Sound types ───────────────────────────────────────────────────
const SOUNDS = {
  bell(ctx, vol, t) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol, t);
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.start(t); osc.stop(t + 1.5);
  },
  chime(ctx, vol, t) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol, t);
    osc.frequency.setValueAtTime(1047, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.start(t); osc.stop(t + 2);
  },
  pulse(ctx, vol, t) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(660, t);
    gain.gain.setValueAtTime(vol,   t + 0.0);
    gain.gain.setValueAtTime(vol,   t + 0.1);
    gain.gain.setValueAtTime(0,     t + 0.2);
    gain.gain.setValueAtTime(vol,   t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.start(t); osc.stop(t + 1);
  },
  soft(ctx, vol, t) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    osc.start(t); osc.stop(t + 2);
  },
};

// ── Public API ────────────────────────────────────────────────────
export function playSound(type = 'bell') {
  if (!settings.sound) return;
  try {
    const ctx = getCtx();
    const vol = (settings.volume / 100) * 0.3;
    const fn  = SOUNDS[type] || SOUNDS.bell;
    fn(ctx, vol, ctx.currentTime);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

// ── Browser notifications ─────────────────────────────────────────
export function sendNotif(title, body) {
  if (settings.notif && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}