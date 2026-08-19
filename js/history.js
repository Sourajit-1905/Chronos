import { historyData, setHistoryData, saveAll } from './state.js';
import { fmt, escHtml, toast } from './utils.js';

// ── Update dashboard stat cards ───────────────────────────────────
export function updateStats() {
  const total    = historyData.reduce((a, h) => a + h.duration, 0);
  const totalMin = Math.round(total / 60);

  document.getElementById('stat-total').textContent    = totalMin >= 60 ? `${Math.round(totalMin / 60)}h` : `${totalMin}m`;
  document.getElementById('stat-sessions').textContent = historyData.length;
  document.getElementById('stat-avg').textContent      = historyData.length ? Math.round(total / historyData.length / 60) + 'm' : '0m';

  // streak
  let streak = 0;
  const todayStart = new Date().setHours(0, 0, 0, 0);
  for (let d = 0; d < 365; d++) {
    const dayStart = todayStart - d * 86_400_000;
    if (historyData.some(h => new Date(h.at).setHours(0, 0, 0, 0) === dayStart)) {
      streak++;
    } else if (d > 0) {
      break;
    }
  }
  document.getElementById('stat-streak').textContent = streak;
}

// ── Render full history view ───────────────────────────────────────
export function renderHistory() {
  const list = document.getElementById('history-list');

  if (!historyData.length) {
    list.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text2)">
      No sessions yet. Complete a timer to see your history.
    </div>`;
    renderChart();
    renderBreakdown();
    return;
  }

  list.innerHTML = historyData.slice(0, 30).map(h => {
    const d = new Date(h.at);
    return `<div class="history-item">
      <div>
        <div class="history-name">${escHtml(h.name)}</div>
        <div class="history-time">${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="history-dur">${fmt(h.duration)}</div>
    </div>`;
  }).join('');

  renderChart();
  renderBreakdown();
}

// ── Clear all history ─────────────────────────────────────────────
export function clearHistory() {
  if (!historyData.length) return;
  if (!confirm('Clear all history?')) return;
  setHistoryData([]);
  saveAll();
  renderHistory();
  updateStats();
  toast('History cleared', 'info');
}

// ── Weekly bar chart ──────────────────────────────────────────────
function renderChart() {
  const chart   = document.getElementById('hist-chart');
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today   = new Date().getDay();                      // 0 = Sun
  // reorder so today is the rightmost bar
  const ordered = [...DAY_LABELS.slice(today), ...DAY_LABELS.slice(0, today)].slice(-7);

  const hours   = new Array(7).fill(0);
  const now     = Date.now();
  historyData.forEach(h => {
    const daysAgo = Math.floor((now - h.at) / 86_400_000);
    if (daysAgo < 7) hours[6 - daysAgo] += h.duration / 3600;
  });

  const maxH = Math.max(...hours, 0.1);

  chart.innerHTML = ordered.map((label, i) => {
    const pct = hours[i] / maxH;
    const barH = Math.max(4, Math.round(pct * 100));
    const val  = hours[i] > 0 ? hours[i].toFixed(1) + 'h' : '';
    return `<div class="bar-wrap">
      <div style="font-size:10px;color:var(--text3);margin-bottom:4px">${val}</div>
      <div style="flex:1;display:flex;align-items:flex-end">
        <div class="bar" style="height:${barH}%;opacity:${(0.4 + pct * 0.6).toFixed(2)}"></div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${label}</div>
    </div>`;
  }).join('');
}

// ── Stats breakdown panel ─────────────────────────────────────────
function renderBreakdown() {
  const el = document.getElementById('hist-breakdown');
  if (!historyData.length) {
    el.innerHTML = `<div style="color:var(--text2);font-size:14px">Complete sessions to see stats.</div>`;
    return;
  }
  const total = historyData.reduce((a, h) => a + h.duration, 0);
  const avg   = total / historyData.length;
  const best  = Math.max(...historyData.map(h => h.duration));

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;font-size:14px">
        <span style="color:var(--text2)">Total focus time</span>
        <span style="color:var(--accent)">${Math.round(total / 60)}m</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:14px">
        <span style="color:var(--text2)">Sessions completed</span>
        <span>${historyData.length}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:14px">
        <span style="color:var(--text2)">Average session</span>
        <span>${Math.round(avg / 60)}m</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:14px">
        <span style="color:var(--text2)">Longest session</span>
        <span>${Math.round(best / 60)}m</span>
      </div>
    </div>`;
}