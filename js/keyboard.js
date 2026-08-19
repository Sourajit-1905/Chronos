import { currentView }       from './nav.js';
import { toggleDashTimer, reset as dashReset, addMinute } from './dashboard.js';
import { togglePomo, pomoReset }   from './pomodoro.js';
import { toggleSW, swReset, swLap } from './stopwatch.js';
import { setDashPreset }   from './dashboard.js';

const PRESET_MINUTES = [1, 5, 10, 15, 25, 30, 45];

export function initKeyboard() {
  document.addEventListener('keydown', e => {
    // ignore when typing in an input
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (currentView === 'dashboard')  toggleDashTimer();
        if (currentView === 'pomodoro')   togglePomo();
        if (currentView === 'stopwatch')  toggleSW();
        break;
    }

    switch (e.key.toLowerCase()) {
      case 'r':
        if (currentView === 'dashboard')  dashReset();
        if (currentView === 'pomodoro')   pomoReset();
        if (currentView === 'stopwatch')  swReset();
        break;
      case 'l':
        if (currentView === 'stopwatch')  swLap();
        break;
    }

    // Number keys 1-7 → quick presets on dashboard
    const n = parseInt(e.key);
    if (n >= 1 && n <= 7 && currentView === 'dashboard') {
      setDashPreset(PRESET_MINUTES[n - 1]);
    }
  });
}