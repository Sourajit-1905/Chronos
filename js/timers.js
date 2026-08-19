import { savedTimers, setSavedTimers, saveAll } from './state.js';
import { fmt, escHtml, toast } from './utils.js';
import { navigate } from './nav.js';
import { dashState } from './state.js';
import { reset as dashReset } from './dashboard.js';

// ── Open / close modal ────────────────────────────────────────────
export function openCreateModal() {
  document.getElementById('create-modal').classList.add('open');
  document.getElementById('create-error').style.display = 'none';
  // reset button in case it was left in "update" state
  const btn = document.querySelector('#create-modal .btn-primary');
  btn.textContent = 'Create timer';
  btn.onclick = createTimer;
}

export function closeCreateModal() {
  document.getElementById('create-modal').classList.remove('open');
}

// ── Fill preset into modal inputs ─────────────────────────────────
export function fillPreset(minutes) {
  document.getElementById('new-h').value = 0;
  document.getElementById('new-m').value = minutes;
  document.getElementById('new-s').value = 0;
}

// ── Create ────────────────────────────────────────────────────────
export function createTimer() {
  const { name, total, sound, err } = readForm();
  if (!total) { showErr(err, 'Set a duration greater than 0.'); return; }
  err.style.display = 'none';

  savedTimers.push({ id: Date.now(), name, total, sound, created: Date.now() });
  saveAll();
  closeCreateModal();
  toast('Timer saved', 'info');
  renderSavedTimers();
}

// ── Edit ──────────────────────────────────────────────────────────
export function editTimer(id) {
  const t = savedTimers.find(x => x.id === id);
  if (!t) return;

  document.getElementById('new-name').value = t.name;
  document.getElementById('new-h').value    = Math.floor(t.total / 3600);
  document.getElementById('new-m').value    = Math.floor((t.total % 3600) / 60);
  document.getElementById('new-s').value    = t.total % 60;
  openCreateModal();

  const btn = document.querySelector('#create-modal .btn-primary');
  btn.textContent = 'Update timer';
  btn.onclick = () => {
    const { name, total, sound, err } = readForm();
    if (!total) { showErr(err, 'Set a duration greater than 0.'); return; }
    err.style.display = 'none';
    const idx = savedTimers.findIndex(x => x.id === id);
    savedTimers[idx] = { ...savedTimers[idx], name, total, sound };
    saveAll();
    closeCreateModal();
    toast('Timer updated', 'info');
    renderSavedTimers();
  };
}

// ── Delete ────────────────────────────────────────────────────────
export function deleteTimer(id) {
  if (!confirm('Delete this timer?')) return;
  setSavedTimers(savedTimers.filter(t => t.id !== id));
  saveAll();
  renderSavedTimers();
  toast('Timer deleted', 'info');
}

// ── Start a saved timer on the dashboard ──────────────────────────
export function startSavedTimer(id) {
  const t = savedTimers.find(x => x.id === id);
  if (!t) return;
  navigate('dashboard');
  dashReset();
  dashState.total     = t.total;
  dashState.remaining = t.total;
  // slight delay so the view transition completes first
  setTimeout(() => {
    import('./dashboard.js').then(m => m.toggleDashTimer());
  }, 250);
}

// ── Render grid ───────────────────────────────────────────────────
export function renderSavedTimers() {
  const grid = document.getElementById('saved-timers-grid');
  if (!savedTimers.length) {
    grid.innerHTML = `
      <div class="card" style="text-align:center;padding:48px;grid-column:1/-1">
        <div style="font-size:32px;margin-bottom:12px">⏱</div>
        <div style="color:var(--text2)">No saved timers yet</div>
        <button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="App.openCreateModal()">
          Create your first timer
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = savedTimers.map(t => `
    <div class="timer-card">
      <div class="timer-card-header">
        <div class="timer-card-name">${escHtml(t.name)}</div>
        <button class="icon-btn" onclick="App.deleteTimer(${t.id})" title="Delete">🗑</button>
      </div>
      <div class="timer-card-time">${fmt(t.total)}</div>
      <div class="timer-card-actions">
        <button class="btn btn-primary btn-sm" onclick="App.startSavedTimer(${t.id})">Start</button>
        <button class="btn btn-secondary btn-sm" onclick="App.editTimer(${t.id})">Edit</button>
      </div>
    </div>
  `).join('');
}

// ── Helpers ───────────────────────────────────────────────────────
function readForm() {
  return {
    name:  document.getElementById('new-name').value.trim() || 'Timer',
    total: (parseInt(document.getElementById('new-h').value) || 0) * 3600
         + (parseInt(document.getElementById('new-m').value) || 0) * 60
         + (parseInt(document.getElementById('new-s').value) || 0),
    sound: document.getElementById('new-sound').value,
    err:   document.getElementById('create-error'),
  };
}

function showErr(el, msg) {
  el.textContent    = msg;
  el.style.display  = 'block';
}