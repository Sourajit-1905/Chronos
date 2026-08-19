import { initNav } from "./nav.js";
import {
    initDashboard,
    setDashPreset,
    toggleDashTimer,
    reset as dashReset,
    addMinute,
    closeCompletion,
    restartFromCompletion,
} from "./dashboard.js";
import {
    initPomodoro,
    setPomoMode,
    togglePomo,
    pomoReset,
    pomoSkip,
    adjustPomo,
} from "./pomodoro.js";
import { toggleSW, swReset, swLap } from "./stopwatch.js";
import {
    renderSavedTimers,
    openCreateModal,
    closeCreateModal,
    fillPreset,
    createTimer,
    editTimer,
    deleteTimer,
    startSavedTimer,
} from "./timers.js";
import { updateStats, clearHistory } from "./history.js";
import {
    applySettings,
    toggleSetting,
    setAccent,
    setVolume,
    requestNotifPerms,
    previewSound,
} from "./settings.js";
import { initKeyboard } from "./keyboard.js";
import {
    coachSend,
    coachKeydown,
    coachResize,
    coachQuickPrompt,
    startPlanItem,
} from "./coachUI.js";

// ── Boot ──────────────────────────────────────────────────────────
initNav();
initDashboard();
initPomodoro();
initKeyboard();
updateStats();
renderSavedTimers();

// ── Expose to HTML onclick attributes ────────────────────────────
window.App = {
    // Dashboard
    setDashPreset,
    toggleDashTimer,
    dashReset,
    addMinute,
    closeCompletion,
    restartFromCompletion,

    // Pomodoro
    setPomoMode,
    togglePomo,
    pomoReset,
    pomoSkip,
    adjustPomo,

    // Stopwatch
    toggleSW,
    swReset,
    swLap,

    // Timers
    openCreateModal,
    closeCreateModal,
    fillPreset,
    createTimer,
    editTimer,
    deleteTimer,
    startSavedTimer,

    // History
    clearHistory,

    // Settings
    toggleSetting,
    setAccent,
    setVolume,
    requestNotifPerms,
    previewSound,

    // AI Coach
    coachSend,
    coachKeydown,
    coachResize,
    coachQuickPrompt,
    startPlanItem,
};

// Close modal on backdrop click
document.getElementById("create-modal").addEventListener("click", (e) => {
    if (e.target.id === "create-modal") closeCreateModal();
});
