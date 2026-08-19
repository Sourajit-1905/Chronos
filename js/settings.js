import { settings, saveAll } from './state.js';
import { playSound } from './audio.js';
import { toast } from './utils.js';

// ── Apply saved settings to the UI ────────────────────────────────
export function applySettings() {
  toggle('toggle-autostart', settings.autostart || false);
  toggle('toggle-sound',     settings.sound);
  toggle('toggle-notif',     settings.notif || false);

  const volSlider = document.getElementById('vol-slider');
  const volVal    = document.getElementById('vol-val');
  volSlider.value = settings.volume || 60;
  volVal.textContent = (settings.volume || 60) + '%';

  if (settings.accent)  document.documentElement.style.setProperty('--accent',  settings.accent);
  if (settings.accent2) document.documentElement.style.setProperty('--accent2', settings.accent2);
}

// ── Toggle a boolean setting ──────────────────────────────────────
export function toggleSetting(el, key) {
  el.classList.toggle('on');
  settings[key] = el.classList.contains('on');
  saveAll();
}

// ── Accent colour ─────────────────────────────────────────────────
export function setAccent(c1, c2, el) {
  settings.accent  = c1;
  settings.accent2 = c2;
  saveAll();

  document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  document.documentElement.style.setProperty('--accent',  c1);
  document.documentElement.style.setProperty('--accent2', c2);
  toast('Accent color updated', 'info');
}

// ── Volume ────────────────────────────────────────────────────────
export function setVolume(value) {
  settings.volume = parseInt(value);
  document.getElementById('vol-val').textContent = value + '%';
  saveAll();
}

// ── Browser notification permission ───────────────────────────────
export function requestNotifPerms(el) {
  if (!('Notification' in window)) {
    toast('Notifications not supported in this browser', 'warn');
    return;
  }
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      el.classList.add('on');
      settings.notif = true;
      saveAll();
      toast('Notifications enabled', 'info');
    } else {
      el.classList.remove('on');
      settings.notif = false;
      toast('Notification permission denied', 'warn');
    }
  });
}

// ── Sound preview ─────────────────────────────────────────────────
export function previewSound() {
  const type = document.getElementById('sound-select').value;
  playSound(type);
}

// ── Helper ────────────────────────────────────────────────────────
function toggle(id, on) {
  document.getElementById(id).classList.toggle('on', on);
}