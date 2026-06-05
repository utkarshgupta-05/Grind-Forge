import { getTaskStats } from "./tasks.js";
import { AppState } from "./state.js";
import { storageGet, storageSet } from "./storage.js";
import { WEATHER_API_KEY } from "./config.js";
import { escapeHTML, getDaysDiff } from "./utils.js";



export function initHomePage() {
    renderHomeStats();
    renderFocusSessionsStat();
    renderUrgentTasks();
    renderWeathercard();
    renderQuoteCard();
    wireQuickActions();
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
    // Show high/medium priority tasks that are incomplete, sorted by due date
    const urgentTasks = (AppState.tasks || [])
        .filter(task => !task.isComplete && (task.priority === 'high' || task.priority === 'medium'))
        .sort((a, b) => {
            // Sort: overdue first, then by due date, then no-date tasks last
            const aDiff = a.dueDate ? getDaysDiff(a.dueDate, today) : 999;
            const bDiff = b.dueDate ? getDaysDiff(b.dueDate, today) : 999;
            return aDiff - bDiff;
        })
        .slice(0, 5); // Show max 5

    if (urgentTasks.length === 0) {
        container.innerHTML = `
            <div class="urgent-task-cards">
                <span></span>
                <div style="color: var(--text-muted); font-style: italic;">No urgent tasks — you're all caught up!</div>
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
                <input type="checkbox" disabled title="Go to Tasks to complete">
                <div>${escapeHTML(task.taskTitle)}</div>
                <div class="${priorityClass}">${escapeHTML(task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}</div>
                <div>${escapeHTML(dueLabel)}</div>
            </div>`;
    }).join('');

    container.innerHTML = tasksHTML;
}

export function wireQuickActions() {
    const addTaskBtn = document.getElementById("quick-add-task");
    const addNoteBtn = document.getElementById("quick-add-note");
    const focusBtn = document.getElementById("quick-start-focus");

    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", () => {
            window.location.href = "tasks.html";
        });
    }
    if (addNoteBtn) {
        addNoteBtn.addEventListener("click", () => {
            window.location.href = "notes.html";
        });
    }
    if (focusBtn) {
        focusBtn.addEventListener("click", () => {
            window.location.href = "focus.html";
        });
    }
}




export async function renderWeathercard() {
    const weatherCard = document.querySelector('.weather-card');
    const weatherShimmer = document.getElementById('weather-shimmer');
    const weatherContent = document.getElementById('weather-content');
    
    const locationHeader = weatherCard?.querySelector('.location h4');
    const tempHeader = weatherCard?.querySelector('.temperature h2');
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
    } catch (error) {
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


