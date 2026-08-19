import { historyData, savedTimers, pomoConfig } from './state.js';
import { fmt } from './utils.js';

// ── Gemini API call ───────────────────────────────────────────────
// Uses gemini-1.5-flash via the generateContent REST endpoint.
// The API key is injected by the proxy server (proxy-server.js).
// Format: Gemini uses { contents: [...] } with role "user"/"model".

async function callGemini(messages, systemPrompt, onChunk) {
  // Convert our chat history format → Gemini's contents format
  // Gemini roles: "user" | "model" (not "assistant")
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch('/gemini/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();

  // Extract text from Gemini response structure
  const text = data.candidates?.[0]?.content?.parts
    ?.map(p => p.text || '')
    .join('') || '';

  if (!text) throw new Error('Gemini returned an empty response.');

  // Simulate word-by-word streaming
  if (onChunk) {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      await new Promise(r => setTimeout(r, 18));
    }
  }

  return text;
}

// ── Build context from user's actual data ─────────────────────────
function buildUserContext() {
  const totalSecs   = historyData.reduce((a, h) => a + h.duration, 0);
  const totalMin    = Math.round(totalSecs / 60);
  const sessions    = historyData.length;
  const avgMin      = sessions ? Math.round(totalSecs / sessions / 60) : 0;
  const recentNames = [...new Set(historyData.slice(0, 10).map(h => h.name))].join(', ');

  return `
USER FOCUS DATA:
- Total focus time logged: ${totalMin} minutes across ${sessions} sessions
- Average session length: ${avgMin} minutes
- Recent session types: ${recentNames || 'none yet'}
- Saved timers: ${savedTimers.map(t => `${t.name} (${fmt(t.total)})`).join(', ') || 'none'}
- Current Pomodoro config: ${pomoConfig.focus}min focus / ${pomoConfig.short}min short break / ${pomoConfig.long}min long break
`.trim();
}

// ── System prompt ─────────────────────────────────────────────────
function getSystemPrompt() {
  return `You are a focus coach inside Chronos, a productivity timer app.
You help users plan their work sessions, choose the right timer strategy, and stay motivated.

Be warm, concise, and practical. Use short paragraphs — no walls of text.
When suggesting timers, be specific (e.g. "try a 45-minute deep work block").
When the user completes a session, acknowledge what they accomplished and suggest what's next.
Never be preachy. Match the user's energy — if they're stressed, be calm; if they're excited, be encouraging.
Respond in plain text only — no markdown headers, no bullet asterisks, just clean readable prose with line breaks.

${buildUserContext()}`;
}

// ── Chat state ────────────────────────────────────────────────────
// Gemini requires the conversation to alternate user/model strictly.
// We store history in our own format and convert on each call.
let chatHistory = [];

export function resetChat() {
  chatHistory = [];
}

// ── Main chat function ────────────────────────────────────────────
export async function sendMessage(userMessage, onChunk) {
  chatHistory.push({ role: 'user', content: userMessage });

  const reply = await callGemini(chatHistory, getSystemPrompt(), onChunk);

  chatHistory.push({ role: 'assistant', content: reply });
  return reply;
}

// ── Proactive suggestions ─────────────────────────────────────────
export async function getSessionSuggestion(context, onChunk) {
  const prompt = context === 'completion'
    ? `The user just completed a focus session. Give a brief warm acknowledgment (1-2 sentences) and suggest their next step — whether that's a break, another session, or calling it a day. Be encouraging but brief.`
    : `The user just opened the app. Based on their history, give a personalized 1-2 sentence suggestion for how to approach their focus session today.`;

  return callGemini(
    [{ role: 'user', content: prompt }],
    getSystemPrompt(),
    onChunk
  );
}

// ── Quick action prompts ──────────────────────────────────────────
export const QUICK_PROMPTS = [
  "What's the best timer for deep work?",
  "I only have 20 minutes — what should I do?",
  "I'm feeling distracted. Help me focus.",
  "Plan my next 2 hours of work.",
  "Should I take a break now?",
];