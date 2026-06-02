import { AppState } from "./state.js";


const SESSION_DURATION_MINUTES = 25;
let timeRemaining = SESSION_DURATION_MINUTES * 60; // seconds
let timerInterval = null;
let isRunning = false;
let sessionStartedAt = null;



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
    if(timeRemaining > 0) {
        timerDisplay.innerHTML = `<p>${minutes}:${seconds}</p>`;
    }
    else {
        timerDisplay.innerHTML = "<p>00:00</p><p>Session Complete!</p>";
    }
    if(timeRemaining <= 5 * 60) {
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

    timerInterval = setInterval(() => {
        timeRemaining--;

        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
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
}

export function resetFocusSession() {
    clearInterval(timerInterval);
    isRunning = false;
    timeRemaining = SESSION_DURATION_MINUTES * 60;
    sessionStartedAt = null;
    updateTimerDisplay();
}


export function saveCompletedSession() {
    const sessionNameInput = document.getElementById('session-name');
    const sessionName = sessionNameInput ? sessionNameInput.value.trim() : "Unnamed Session";
    const completedSession = {
        sessionId:crypto.randomUUID(),
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
        <div class="focus-session-item">
            <p><strong>${session.sessionName}</strong></p>
            <p>Duration: ${session.durationMinutes} minutes</p>
            <p>Completed on: ${new Date(session.completedAt).toLocaleString()}</p>
        </div>
    `).join('');
    historyContainer.innerHTML = historyHTML;
}