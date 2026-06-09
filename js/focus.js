import { AppState } from "./state.js";
import { escapeHTML } from "./utils.js";


const SESSION_DURATION_MINUTES = 25;
let timeRemaining = SESSION_DURATION_MINUTES * 60; // seconds
let timerInterval = null;
let isRunning = false;
let sessionStartedAt = null;
let sessionEndTime = null; // wall-clock end time in ms (fixes drift)



export function initFocusPage() {
    const startBtn = document.getElementById('start-focus-btn');
    const resetBtn = document.getElementById('reset-focus-btn');
    const pauseBtn = document.getElementById('pause-focus-btn');
    if (!startBtn || !resetBtn || !pauseBtn) {
        return;
    }
    startBtn.addEventListener('click', startFocusSession);
    resetBtn.addEventListener('click', resetFocusSession);
    pauseBtn.addEventListener('click', pauseFocusSession);
    updateTimerDisplay();
    renderFocusHistory();
}


export function updateTimerDisplay() {
    const timerDisplay = document.getElementById('focus-timer-display');
    if (!timerDisplay) {
        return;
    }
    const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const seconds = (timeRemaining % 60).toString().padStart(2, '0');
    if (timeRemaining > 0) {
        timerDisplay.innerHTML = `<p>${minutes}:${seconds}</p>`;
    }
    else {
        timerDisplay.innerHTML = "<p>00:00</p><p>Session Complete!</p>";
    }
    if (timeRemaining <= 5 * 60) {
        timerDisplay.classList.add('warning');
    }
    else {
        timerDisplay.classList.remove('warning');
    }
}


export function startFocusSession() {
    if (isRunning) {
        return;
    }
    isRunning = true;

    if (!sessionStartedAt) {
        sessionStartedAt = new Date().toISOString();
    }

    // Wall-clock fix: record when the session should end
    sessionEndTime = Date.now() + timeRemaining * 1000;

    timerInterval = setInterval(() => {
        // Compute remaining from wall clock to avoid drift
        const remaining = Math.max(0, Math.round((sessionEndTime - Date.now()) / 1000));
        timeRemaining = remaining;

        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            sessionEndTime = null;
            saveCompletedSession();
        }
    }, 1000);
}

export function pauseFocusSession() {
    if (!isRunning) {
        return;
    }
    isRunning = false;
    clearInterval(timerInterval);
    // timeRemaining is already accurate from last tick; sessionEndTime is no longer valid
    sessionEndTime = null;
}

export function resetFocusSession() {
    clearInterval(timerInterval);
    isRunning = false;
    timeRemaining = SESSION_DURATION_MINUTES * 60;
    sessionStartedAt = null;
    sessionEndTime = null;
    updateTimerDisplay();
}


export function saveCompletedSession() {
    const sessionNameInput = document.getElementById('session-name');
    const sessionName = sessionNameInput ? sessionNameInput.value.trim() : "Unnamed Session";
    const completedSession = {
        sessionId: crypto.randomUUID(),
        sessionName,
        durationMinutes: SESSION_DURATION_MINUTES,
        startedAt: sessionStartedAt,
        completedAt: new Date().toISOString()
    };
    AppState.focusSessions.push(completedSession);
    AppState.save();
    sessionStartedAt = null;
    sessionNameInput.value = "";
    renderFocusHistory();
}


export function renderFocusHistory() {
    const historyContainer = document.getElementById('focus-history-list');
    if (!historyContainer) {
        return;
    }
    const sessions = [...AppState.focusSessions]
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    if (sessions.length === 0) {
        historyContainer.innerHTML = "<p>No focus sessions completed yet.</p>";
        return;
    }
    const historyHTML = sessions.map(session => `
        
        <div class="focus-session-item" data-focus-id="${escapeHTML(session.sessionId)}">
            <div class="focus-card-header">
                <h3 class="focus-title">${escapeHTML(session.sessionName)}</h3>
            </div>
            <div class="focus-card-body">
                <p class="focus-content-text">Duration : ${escapeHTML(String(session.durationMinutes))}</p>
            </div>
            <div class="focus-card-footer">
                <div class="focus-meta">
                    <span class="focus-date-text">Started on : ${new Date(session.startedAt).toLocaleString([],{ month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(session.startedAt).toLocaleString([],{ hour: 'numeric', minute: '2-digit' })}</span>
                    <span class="focus-date-text">Completed on : ${new Date(session.completedAt).toLocaleString([],{ month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(session.completedAt).toLocaleString([],{ hour: 'numeric', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    `).join('');
    historyContainer.innerHTML = historyHTML;
}

/*<div class="focus-session-item">
            <p><strong>${escapeHTML(session.sessionName)}</strong></p>
            <p>Duration: ${escapeHTML(String(session.durationMinutes))} minutes</p>
            <p>Completed on: ${new Date(session.completedAt).toLocaleString()}</p>
        </div>*/