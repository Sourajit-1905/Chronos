import { historyData, savedTimers, pomoConfig } from './state.js';
import { fmt } from './utils.js';

// ── Constants ─────────────────────────────────────────────────────
// Model is set here — update this if Google deprecates it again
const MODEL        = window.__GEMINI_MODEL__ || 'gemini-3.6-flash';
const MAX_TOKENS   = 800;                        // kept under 1000 so replies finish cleanly
const MAX_HISTORY  = 10;                         // cap turns kept in memory to save TPM

// ── Gemini API call ───────────────────────────────────────────────
async function callGemini(messages, systemPrompt, onChunk) {
  // Convert chat history → Gemini format
  // Gemini roles are "user" | "model" (not "assistant")
  const contents = messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`/gemini/v1beta/models/${MODEL}:generateContent`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature:     0.7,
      },
    }),
  });

  // ── HTTP-level errors (429 rate limit, 401 bad key, etc.) ────────
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const status  = res.status;
    const message = err.error?.message || '';

    if (status === 429) {
      throw new Error(
        'Rate limit reached. You\'ve hit the free-tier request cap — wait a minute and try again, or reduce how often you message the coach.'
      );
    }
    if (status === 401 || status === 403) {
      throw new Error('Invalid API key. Check your GEMINI_API_KEY in the proxy server.');
    }
    throw new Error(message || `Gemini API error ${status}`);
  }

  const data = await res.json();

  // ── Extract text ──────────────────────────────────────────────────
  const candidate   = data.candidates?.[0];
  const finishReason = candidate?.finishReason || 'STOP';
  const text = candidate?.content?.parts
    ?.map(p => p.text || '')
    .join('') || '';

  if (!text) {
    // Gemini can return empty on safety blocks
    const blocked = candidate?.finishReason === 'SAFETY';
    throw new Error(
      blocked
        ? 'The response was blocked by Gemini\'s safety filters. Try rephrasing your message.'
        : 'Gemini returned an empty response.'
    );
  }

  // ── Handle MAX_TOKENS truncation ──────────────────────────────────
  // If the model ran out of tokens, append a note so the user knows
  // the reply was cut short rather than seeing a dangling sentence.
  const wasTruncated = finishReason === 'MAX_TOKENS';
  const finalText    = wasTruncated
    ? text.trimEnd() + '… (response cut short — ask me to continue)'
    : text;

  // ── Simulate word-by-word streaming ──────────────────────────────
  if (onChunk) {
    const words = finalText.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      await new Promise(r => setTimeout(r, 18));
    }
  }

  return finalText;
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
- Pomodoro config: ${pomoConfig.focus}min focus / ${pomoConfig.short}min short break / ${pomoConfig.long}min long break
`.trim();
}

// ── System prompt ─────────────────────────────────────────────────
function getSystemPrompt() {
  return `You are a focus coach inside Chronos, a productivity timer app.
You help users plan their work sessions, choose the right timer strategy, and stay motivated.

Be warm, concise, and practical. Use short paragraphs — no walls of text.
When suggesting timers, be specific (e.g. "try a 45-minute deep work block").
Never be preachy. Match the user's energy — calm if stressed, encouraging if excited.
Respond in plain text only — no markdown headers, no bullet asterisks, just clean readable prose.
Keep responses under 150 words so they fit comfortably on screen.

${buildUserContext()}`;
}

// ── Chat history (capped to save tokens) ─────────────────────────
let chatHistory = [];

export function resetChat() {
  chatHistory = [];
}

// ── Main chat function ────────────────────────────────────────────
export async function sendMessage(userMessage, onChunk) {
  chatHistory.push({ role: 'user', content: userMessage });

  // Trim oldest turns if history gets long (keep last N turns)
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY);
  }

  const reply = await callGemini(chatHistory, getSystemPrompt(), onChunk);

  chatHistory.push({ role: 'assistant', content: reply });
  return reply;
}

// ── One-shot suggestions (no history needed) ──────────────────────
export async function getSessionSuggestion(context, onChunk) {
  const prompt = context === 'completion'
    ? 'The user just completed a focus session. Give a warm 1-2 sentence acknowledgment and suggest their next step. Be brief.'
    : 'The user just opened the app. Give a personalized 1-2 sentence suggestion for their focus session today based on their history.';

  return callGemini(
    [{ role: 'user', content: prompt }],
    getSystemPrompt(),
    onChunk
  );
}

// ── Quick prompts ─────────────────────────────────────────────────
export const QUICK_PROMPTS = [
  "What's the best timer for deep work?",
  "I only have 20 minutes — what should I do?",
  "I'm feeling distracted. Help me focus.",
  "Plan my next 2 hours of work.",
  "Should I take a break now?",
];