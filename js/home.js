import { getTaskStats } from "./tasks.js";
import { AppState } from "./state.js";
import { storageGet, storageSet } from "./storage.js";
import { WEATHER_API_KEY } from "./config.js";
import { escapeHTML, getDaysDiff, formatCurrency, debounce, parseLocalDate } from "./utils.js";
import { getSettingFocusDuration, getSettingMonthlyBudget } from "./settings.js";



export function initHomePage() {
    renderHomeStats();
    renderFocusSessionsStat();
    renderUrgentTasks();
    renderWeathercard();
    renderQuoteCard();
    renderRecentExpenses();
    initHomeTimer();
    initQuickNotes();
}



export function renderHomeStats() {
    const stats = getTaskStats();
    const totalTasksEl = document.getElementById("home-total-tasks");
    const completedTodayEl = document.getElementById("home-completed-today");
    const pendingTasksEl = document.getElementById("home-pending-tasks");

    if (!totalTasksEl || !completedTodayEl || !pendingTasksEl) {
        return;
    }

    totalTasksEl.textContent = stats.totalTasks;
    completedTodayEl.textContent = stats.completedToday;
    pendingTasksEl.textContent = stats.pendingTasks;
}

export function renderFocusSessionsStat() {
    const focusEl = document.getElementById("home-focus-sessions");
    if (!focusEl) return;
    focusEl.textContent = (AppState.focusSessions || []).length;
}

export function renderUrgentTasks() {
    const container = document.getElementById("urgent-task-cards-container");
    if (!container) return;

    const today = new Date();
    // Show tasks that are incomplete AND (priority is high OR due date is today)
    const urgentTasks = (AppState.tasks || [])
        .filter(task => {
            if (task.isComplete) return false;
            const daysLeft = task.dueDate ? getDaysDiff(task.dueDate, today) : null;
            const isDueToday = daysLeft === 0;
            return task.priority === 'high' || isDueToday;
        })
        .sort((a, b) => {
            // Sort: overdue first, then by due date, then no-date tasks last
            const aDiff = a.dueDate ? getDaysDiff(a.dueDate, today) : 999;
            const bDiff = b.dueDate ? getDaysDiff(b.dueDate, today) : 999;
            if (aDiff !== bDiff) return aDiff - bDiff;
            // if same date, high priority first
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
        })
        .slice(0, 5); // Show max 5

    if (urgentTasks.length === 0) {
        container.innerHTML = `
            <div class="urgent-task-cards">
                <span></span>
                <div style="color: var(--text-muted); font-style: italic;">No priority tasks — you're all caught up!</div>
                <div></div>
                <div></div>
            </div>`;
        return;
    }

    const tasksHTML = urgentTasks.map(task => {
        const daysLeft = task.dueDate ? getDaysDiff(task.dueDate, today) : null;
        let dueLabel = 'No due date';
        if (daysLeft !== null) {
            if (daysLeft < 0) dueLabel = `Overdue (${Math.abs(daysLeft)}d)`;
            else if (daysLeft === 0) dueLabel = 'Today';
            else if (daysLeft === 1) dueLabel = 'Tomorrow';
            else dueLabel = `In ${daysLeft}d`;
        }
        const priorityClass = task.priority === 'high' ? 'text-danger' : 'text-warning';
        return `
            <div class="urgent-task-cards">
                <input type="checkbox" data-task-id="${escapeHTML(task.taskId)}" class="home-urgent-task-checkbox" title="Mark as complete">
                <div>${escapeHTML(task.taskTitle)}</div>
                <div class="${priorityClass}"><span class="task-priority-badge">${escapeHTML(task.priority)}</span></div>
                <div>${escapeHTML(dueLabel)}</div>
            </div>`;
    }).join('');

    container.innerHTML = tasksHTML;

    // Add event listeners to checkboxes
    const checkboxes = container.querySelectorAll('.home-urgent-task-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                const taskId = e.target.getAttribute('data-task-id');
                completeTaskFromHome(taskId);
            }
        });
    });
}

function completeTaskFromHome(taskId) {
    if (!AppState.tasks) return;
    const task = AppState.tasks.find(t => t.taskId === taskId);
    if (task) {
        task.isComplete = true;
        task.completedAt = new Date().toISOString();
        AppState.save();
        renderUrgentTasks();
        renderHomeStats();
    }
}

export function renderRecentExpenses() {
    const container = document.getElementById("home-expense-list-container");
    const totalEl = document.getElementById("home-expenses-total");
    const progressFillEl = document.getElementById("home-expenses-progress-fill");

    if (!container) return;

    const expenses = (AppState.expenses || []);
    const sortedExpenses = [...expenses].sort((a, b) => parseLocalDate(b.expenseDate) - parseLocalDate(a.expenseDate));

    // Calculate total spent in current month
    const today = new Date();
    const firstDateOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthlySpent = expenses.reduce((acc, curr) => {
        const expenseDate = parseLocalDate(curr.expenseDate);
        if (expenseDate >= firstDateOfMonth && expenseDate <= today) {
            return acc + parseFloat(curr.expenseAmount);
        }
        return acc;
    }, 0);

    if (totalEl) {
        totalEl.textContent = formatCurrency(monthlySpent);
    }

    if (progressFillEl) {
        const budget = getSettingMonthlyBudget();
        const percentage = Math.min(100, (monthlySpent / budget) * 100);
        progressFillEl.style.width = `${percentage}%`;
    }

    // Update the budget label on the home page if present
    const budgetLimitEl = document.getElementById("home-expenses-budget-limit");
    if (budgetLimitEl) {
        budgetLimitEl.textContent = formatCurrency(getSettingMonthlyBudget());
    }

    const recent = sortedExpenses.slice(0, 3);
    if (recent.length === 0) {
        container.innerHTML = `
            <div style="color: var(--text-muted); font-size: 0.85rem; font-style: italic; padding: 16px; background: var(--hover-bg); border-radius: 8px; text-align: center; border: 1px solid var(--card-border);">
                No recent expenses logged.
            </div>`;
        return;
    }

    const categoryIcons = {
        food: "🍔",
        transport: "🚗",
        utilities: "⚡",
        entertainment: "🎬",
        shopping: "🛒",
        housing: "🏠",
        health: "⚕️",
        education: "🎓",
        other: "💸"
    };

    container.innerHTML = recent.map(exp => {
        const cat = exp.expenseCategory ? exp.expenseCategory.toLowerCase() : "other";
        const icon = categoryIcons[cat] || "💸";
        const formattedDate = exp.expenseDate ? parseLocalDate(exp.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--card-border);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--hover-bg); border: 1px solid var(--card-border); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                        ${icon}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${escapeHTML(exp.expenseTitle)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                            ${escapeHTML(exp.expenseCategory.charAt(0).toUpperCase() + exp.expenseCategory.slice(1))} &bull; ${escapeHTML(formattedDate)}
                        </div>
                    </div>
                </div>
                <div style="font-weight: 700; color: var(--expense-accent); font-size: 0.95rem;">
                    -${formatCurrency(exp.expenseAmount)}
                </div>
            </div>`;
    }).join("");
}

let homeTimeRemaining = 25 * 60; // 25 minutes
let homeTimerInterval = null;
let homeTimerIsRunning = false;
let homeSessionStartedAt = null;
let homeSessionEndTime = null;

export function initHomeTimer() {
    const display = document.getElementById("home-timer-display");
    const startBtn = document.getElementById("home-timer-start-btn");
    const pauseBtn = document.getElementById("home-timer-pause-btn");
    const resetBtn = document.getElementById("home-timer-reset-btn");
    const nameInput = document.getElementById("home-timer-session-name");
    const circle = document.getElementById("home-progress-ring-circle");

    if (!display || !startBtn || !pauseBtn || !resetBtn) return;

    const SESSION_DURATION_MINUTES = getSettingFocusDuration();
    const CIRCLE_RADIUS = 115;
    const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

    let timeRemaining = SESSION_DURATION_MINUTES * 60;
    let timerInterval = null;
    let isRunning = false;
    let sessionStartedAt = null;
    let sessionEndTime = null;

    if (circle) {
        circle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        circle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    }

    function saveFocusState() {
        storageSet("app_focus_timer_state", {
            timeRemaining,
            isRunning,
            sessionStartedAt,
            sessionEndTime
        });
    }

    const savedState = storageGet("app_focus_timer_state");
    if (savedState) {
        isRunning = savedState.isRunning;
        timeRemaining = savedState.timeRemaining;
        sessionStartedAt = savedState.sessionStartedAt;
        sessionEndTime = savedState.sessionEndTime;

        if (isRunning && sessionEndTime) {
            timeRemaining = Math.max(0, Math.round((sessionEndTime - Date.now()) / 1000));
            if (timeRemaining > 0) {
                timerInterval = setInterval(homeFocusTick, 1000);
                startBtn.disabled = true;
                pauseBtn.disabled = false;
            } else {
                isRunning = false;
                sessionEndTime = null;
                saveCompletedSession();
            }
        } else if (isRunning === false) {
            if (timeRemaining !== SESSION_DURATION_MINUTES * 60) {
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        }
    }

    function updateHomeTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const seconds = (timeRemaining % 60).toString().padStart(2, '0');
        if (timeRemaining > 0) {
            display.textContent = `${minutes}:${seconds}`;
        } else {
            display.textContent = "Complete!";
        }

        if (circle) {
            const totalSeconds = SESSION_DURATION_MINUTES * 60;
            const progress = timeRemaining / totalSeconds;
            const offset = CIRCLE_CIRCUMFERENCE - (progress * CIRCLE_CIRCUMFERENCE);
            circle.style.strokeDashoffset = offset;
        }
    }

    function saveCompletedSession() {
        const sessionName = nameInput && nameInput.value.trim() !== "" ? nameInput.value.trim() : "Unnamed Session";
        const completedSession = {
            sessionId: crypto.randomUUID(),
            sessionName: sessionName,
            durationMinutes: SESSION_DURATION_MINUTES,
            startedAt: sessionStartedAt,
            completedAt: new Date().toISOString()
        };
        if (!AppState.focusSessions) AppState.focusSessions = [];
        AppState.focusSessions.push(completedSession);
        AppState.save();

        sessionStartedAt = null;
        if (nameInput) nameInput.value = "";
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        timeRemaining = SESSION_DURATION_MINUTES * 60;
        saveFocusState();
        updateHomeTimerDisplay();

        setTimeout(() => {
            updateHomeTimerDisplay();
        }, 3000);

        renderFocusSessionsStat();
    }

    function homeFocusTick() {
        const remaining = Math.max(0, Math.round((sessionEndTime - Date.now()) / 1000));
        timeRemaining = remaining;
        saveFocusState();
        updateHomeTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            sessionEndTime = null;
            saveFocusState();
            saveCompletedSession();
        }
    }

    startBtn.addEventListener("click", () => {
        if (isRunning) return;
        isRunning = true;

        if (!sessionStartedAt) {
            sessionStartedAt = new Date().toISOString();
        }

        sessionEndTime = Date.now() + timeRemaining * 1000;
        saveFocusState();

        startBtn.disabled = true;
        pauseBtn.disabled = false;

        timerInterval = setInterval(homeFocusTick, 1000);
    });

    pauseBtn.addEventListener("click", () => {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(timerInterval);
        sessionEndTime = null;
        saveFocusState();
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });

    resetBtn.addEventListener("click", () => {
        clearInterval(timerInterval);
        isRunning = false;
        timeRemaining = SESSION_DURATION_MINUTES * 60;
        sessionStartedAt = null;
        sessionEndTime = null;
        saveFocusState();
        
        updateHomeTimerDisplay();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        if (nameInput) nameInput.value = "";
    });

    updateHomeTimerDisplay();
}

export function initQuickNotes() {
    const textarea = document.getElementById("home-note-textarea");
    const saveBtn = document.getElementById("home-save-note-btn");
    const statusEl = document.getElementById("home-note-status");

    if (!textarea || !saveBtn || !statusEl) return;

    // Load draft
    const draft = storageGet("quick-note-draft");
    if (draft) {
        textarea.value = draft;
        const draftTime = storageGet("quick-note-draft-time");
        if (draftTime) {
            const time = new Date(draftTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            statusEl.textContent = `Draft (autosaved at ${time})`;
        }
    }

    // Auto-save on typing
    const autoSaveDraft = debounce(() => {
        const val = textarea.value;
        storageSet("quick-note-draft", val);
        const time = new Date();
        storageSet("quick-note-draft-time", time.toISOString());
        statusEl.textContent = `Draft auto-saved`;
    }, 500);

    textarea.addEventListener("input", autoSaveDraft);

    // Save Note to AppState.notes on button click
    saveBtn.addEventListener("click", () => {
        const val = textarea.value.trim();
        if (!val) {
            statusEl.textContent = "Cannot save empty note!";
            statusEl.style.color = "var(--danger)";
            setTimeout(() => {
                statusEl.textContent = "Saved Draft";
                statusEl.style.color = "var(--text-muted)";
            }, 2000);
            return;
        }

        const dateStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        const noteTitle = `Quick Note - ${dateStr}`;
        const newNote = {
            noteId: crypto.randomUUID(),
            noteTitle: noteTitle,
            noteContent: val,
            createdAt: new Date().toISOString(),
            updatedAt: null
        };

        if (!AppState.notes) AppState.notes = [];
        AppState.notes.push(newNote);
        AppState.save();

        textarea.value = "";
        storageSet("quick-note-draft", "");
        storageSet("quick-note-draft-time", "");

        statusEl.textContent = "Saved to Notes list!";
        statusEl.style.color = "var(--success)";
        setTimeout(() => {
            statusEl.textContent = "New Draft";
            statusEl.style.color = "var(--text-muted)";
        }, 3000);
    });
}




export async function renderWeathercard() {
    const weatherCard = document.querySelector('.weather-card');
    const weatherShimmer = document.getElementById('weather-shimmer');
    const weatherContent = document.getElementById('weather-content');
    
    const locationHeader = weatherCard?.querySelector('.location h4');
    const tempHeader = weatherCard?.querySelector('.temperature h2');
    const weatherIcon = weatherCard?.querySelector('.weather-icon');
    const descHeader = weatherCard?.querySelector('.weather-description h5');

    if (!weatherCard || !locationHeader || !tempHeader || !descHeader) {
        return;
    }

    // Show shimmer, hide content
    if (weatherShimmer) weatherShimmer.style.display = 'flex';
    if (weatherContent) weatherContent.style.display = 'none';

    if (!navigator.geolocation) {
        locationHeader.textContent = 'Geolocation not supported';
        tempHeader.textContent = '--°C';
        descHeader.textContent = 'Weather unavailable';
        if (weatherShimmer) weatherShimmer.style.display = 'none';
        if (weatherContent) weatherContent.style.display = 'block';
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });

        const result = await getData2loc(position.coords.latitude, position.coords.longitude);
        if (!result || !result.location || !result.current) {
            throw new Error('Invalid weather response');
        }

        locationHeader.textContent = `${result.location.name}, ${result.location.region} - ${result.location.country}`;
        tempHeader.textContent = `${Math.round(result.current.temp_c)}°C`;
        descHeader.textContent = result.current.condition?.text || 'Unknown condition';
        if (weatherIcon && result.current.condition?.icon) {
            // Use 128x128 high-res version instead of default 64x64
            weatherIcon.src = `https:${result.current.condition.icon}`.replace('64x64', '128x128');
            weatherIcon.style.display = 'block';
        }
    } catch (error) {
        if (weatherIcon) weatherIcon.style.display = 'none';
        locationHeader.textContent = 'Location unavailable';
        tempHeader.textContent = '--°C';
        descHeader.textContent = 'Unable to fetch weather';
        console.warn('Weather widget error:', error);
    } finally {
        // Hide shimmer, show content
        if (weatherShimmer) weatherShimmer.style.display = 'none';
        if (weatherContent) weatherContent.style.display = 'block';
    }
}

export async function renderQuoteCard() {
    const quoteTextEl = document.querySelector('.quote-card .quote-text');
    const quoteAuthorEl = document.querySelector('.quote-card .quote-author');
    const quoteShimmer = document.getElementById('quote-shimmer');
    const quoteContent = document.getElementById('quote-content');

    if (!quoteTextEl || !quoteAuthorEl) {
        return;
    }

    // Show shimmer, hide content
    if (quoteShimmer) quoteShimmer.style.display = 'flex';
    if (quoteContent) quoteContent.style.display = 'none';

    const targetKeywords = ['ambition', 'inspiration', 'goals', 'deterministic', 'motivat', 'success', 'persever'];
    
    try {
        // Check localStorage for today's quote
        const today = new Date().toDateString();
        const storedData = storageGet('todayQuote');
        
        if (storedData) {
            const parsed = typeof storedData === 'string' ? JSON.parse(storedData) : storedData;
            if (parsed.date === today) {
                quoteTextEl.textContent = parsed.text;
                quoteAuthorEl.textContent = `- ${parsed.author}`;
                if (quoteShimmer) quoteShimmer.style.display = 'none';
                if (quoteContent) quoteContent.style.display = 'block';
                return;
            }
        }

        // Fetch until we get a quote with target keywords
        let foundQuote = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!foundQuote && attempts < maxAttempts) {
            const response = await fetch('https://thequoteshub.com/api/', {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Quote API error: ${response.status}`);
            }

            const data = await response.json();
            const quoteKeywords = Array.isArray(data?.tags) ? data.tags.map(k => k.toLowerCase()) : [];
            const hasTargetKeyword = targetKeywords.some(keyword => 
                quoteKeywords.some(quoteKey => quoteKey.includes(keyword))
            );
            const quoteText = data?.text || '';
            const isShortEnough = quoteText.length <= 100 && quoteText.length>=8;

            if (hasTargetKeyword && isShortEnough) {
                foundQuote = data;
            }
            attempts++;
        }

        if (foundQuote) {
            const quoteData = {
                date: today,
                text: foundQuote?.text || 'Stay focused and keep moving forward.',
                author: foundQuote?.author || 'Unknown',
            };
            storageSet('todayQuote', quoteData);
            quoteTextEl.textContent = quoteData.text;
            quoteAuthorEl.textContent = `- ${quoteData.author}`;
        } else {
            quoteTextEl.textContent = 'Stay focused and keep moving forward.';
            quoteAuthorEl.textContent = '- Keep pushing';
        }
    } catch (error) {
        quoteTextEl.textContent = 'Could not load quote of the day.';
        quoteAuthorEl.textContent = '- Please try again later';
        console.warn('Quote widget error:', error);
    } finally {
        // Hide shimmer, show content
        if (quoteShimmer) quoteShimmer.style.display = 'none';
        if (quoteContent) quoteContent.style.display = 'block';
    }
}

async function getData2loc(lat, long) {
    // ⚠️ API key loaded from config.js — add config.js to .gitignore before committing
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${lat},${long}&aqi=yes`);
    return await response.json();
}


