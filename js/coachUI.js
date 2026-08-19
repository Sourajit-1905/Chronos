import { sendMessage, getSessionSuggestion, resetChat, QUICK_PROMPTS } from './coach.js';
import { navigate } from './nav.js';
import { dashState } from './state.js';
import { fmt, toast } from './utils.js';

let isTyping  = false;
let hasGreeted = false;

// ── Init (called when coach view opens) ───────────────────────────
export async function initCoach() {
  renderQuickPrompts();
  if (!hasGreeted) {
    hasGreeted = true;
    await showGreeting();
  }
}

// ── Greeting ──────────────────────────────────────────────────────
async function showGreeting() {
  addMsg('coach', null, true); // typing indicator
  try {
    let text = '';
    await getSessionSuggestion('greeting', chunk => {
      text += chunk;
      updateLastCoachMsg(text);
    });
    finaliseLastCoachMsg(text);
  } catch (e) {
    finaliseLastCoachMsg("Hi! I'm your Focus Coach. Tell me what you're working on and I'll help you plan the best timer strategy. What's on your agenda today?");
  }
}

// ── Send message ──────────────────────────────────────────────────
export async function coachSend() {
  if (isTyping) return;
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = '';

  addMsg('user', text);
  addMsg('coach', null, true); // typing indicator
  setSendBtn(false);
  isTyping = true;

  try {
    let reply = '';
    await sendMessage(text, chunk => {
      reply += chunk;
      updateLastCoachMsg(reply);
    });
    finaliseLastCoachMsg(reply);
    tryExtractPlan(reply);
  } catch (e) {
    const errMsg = e.message.includes('401') || e.message.includes('403')
      ? 'API key issue — make sure you\'re serving the app with a valid Anthropic API key set up.'
      : `Couldn't reach the coach right now: ${e.message}`;
    finaliseLastCoachMsg(errMsg);
  } finally {
    isTyping = false;
    setSendBtn(true);
  }
}

// ── Keydown handler ───────────────────────────────────────────────
export function coachKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    coachSend();
  }
}

// ── Auto-resize textarea ──────────────────────────────────────────
export function coachResize(el) {
  el.style.height = '';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Called from dashboard on session complete ─────────────────────
export async function coachOnComplete(sessionName, durationSecs) {
  // silently prime the chat with context, then show a toast invite
  toast('🧠 Coach has a suggestion — check AI Coach', 'info');
  hasGreeted = false; // force a fresh completion greeting next open
}

// ── Quick prompt buttons ──────────────────────────────────────────
function renderQuickPrompts() {
  const container = document.getElementById('quick-prompts-list');
  if (!container) return;
  container.innerHTML = QUICK_PROMPTS.map(p => `
    <button class="quick-prompt-btn" onclick="App.coachQuickPrompt(${JSON.stringify(p)})">${p}</button>
  `).join('');
}

export function coachQuickPrompt(prompt) {
  const input = document.getElementById('chat-input');
  input.value = prompt;
  coachSend();
  navigate('coach');
}

// ── Extract a session plan from AI reply ──────────────────────────
function tryExtractPlan(text) {
  // look for patterns like "45 minutes", "25-minute", "1 hour", etc.
  const timeRx = /(\d+)[\s-]*(minute|min|hour|hr)s?/gi;
  const lines  = text.split(/[\n.!?]+/).filter(l => l.trim().length > 10);

  const items = [];
  for (const line of lines) {
    const match = timeRx.exec(line);
    timeRx.lastIndex = 0;
    if (match) {
      const amount = parseInt(match[1]);
      const unit   = match[2].toLowerCase();
      const mins   = unit.startsWith('h') ? amount * 60 : amount;
      const label  = line.trim().replace(/^[-•*]\s*/, '').slice(0, 60);
      items.push({ label, mins });
      if (items.length >= 5) break;
    }
  }

  if (items.length < 2) return; // not enough to show a plan

  const planEl = document.getElementById('plan-content');
  planEl.innerHTML = items.map(item => `
    <div class="plan-item">
      <div class="plan-dot"></div>
      <div class="plan-label">${escHtml(item.label)}</div>
      <div class="plan-dur">${item.mins}m</div>
    </div>
  `).join('') + `
    <button class="start-plan-btn" onclick="App.startPlanItem(${items[0].mins})">
      ▶ Start first block (${items[0].mins}m)
    </button>`;
}

export function startPlanItem(mins) {
  navigate('dashboard');
  import('./dashboard.js').then(m => {
    m.setDashPreset(mins);
    setTimeout(() => m.toggleDashTimer(), 300);
  });
}

// ── DOM helpers ───────────────────────────────────────────────────
function addMsg(role, text, typing = false) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'coach' ? '🧠' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (typing) {
    bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    div.dataset.typing = 'true';
  } else {
    bubble.textContent = text;
  }

  div.appendChild(avatar);
  div.appendChild(bubble);
  container.appendChild(div);
  scrollToBottom(container);
}

function updateLastCoachMsg(text) {
  const container = document.getElementById('chat-messages');
  const msgs = container.querySelectorAll('.msg-coach');
  const last = msgs[msgs.length - 1];
  if (!last) return;
  last.querySelector('.msg-bubble').textContent = text;
  scrollToBottom(container);
}

function finaliseLastCoachMsg(text) {
  const container = document.getElementById('chat-messages');
  const msgs = container.querySelectorAll('.msg-coach');
  const last = msgs[msgs.length - 1];
  if (!last) return;
  last.dataset.typing = '';
  last.querySelector('.msg-bubble').textContent = text;
  scrollToBottom(container);
}

function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}

function setSendBtn(enabled) {
  const btn = document.getElementById('send-btn');
  if (btn) btn.disabled = !enabled;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}