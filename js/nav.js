import { renderSavedTimers }  from './timers.js';
import { renderHistory }      from './history.js';
import { applySettings }      from './settings.js';

export let currentView = 'dashboard';

export function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item, .mob-nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll(`[data-view="${view}"]`).forEach(n => n.classList.add('active'));

  currentView = view;

  if (view === 'timers')   renderSavedTimers();
  if (view === 'history')  renderHistory();
  if (view === 'settings') applySettings();
  if (view === 'coach') {
    // lazy import to avoid circular deps
    import('./coachUI.js').then(m => m.initCoach());
  }
}

export function initNav() {
  document.querySelectorAll('[data-view]').forEach(el =>
    el.addEventListener('click', () => navigate(el.dataset.view))
  );
}