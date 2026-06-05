import { getTaskStats } from './tasks.js';
import { getNoteStats } from './notes.js';
import { getExpenseStats } from './expenses.js';
import { AppState } from './state.js';
import { escapeHTML } from './utils.js';

const DEFAULT_DASHBOARD_TAB = 'all';
let currentDashboardTab = DEFAULT_DASHBOARD_TAB;

function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
}

function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '0';
    }
    return String(value);
}

function formatMinutes(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '0 min';
    }
    return `${value} min`;
}

function getStatsForDashboardTab(tabName) {
    const selectedTab = tabName || currentDashboardTab || DEFAULT_DASHBOARD_TAB;
    if (selectedTab === 'tasks') {
        const stats = getTaskDashboardStats();
        return [
            { label: 'Total Tasks', value: formatNumber(stats.totalTasks) },
            { label: 'Completed Tasks', value: formatNumber(stats.completedTasks) },
            { label: 'Pending Tasks', value: formatNumber(stats.pendingTasks) },
            { label: 'Overdue Tasks', value: formatNumber(stats.overdueTasks) },
            { label: 'Completed Today', value: formatNumber(stats.completedToday) },
            { label: 'Completion Rate', value: `${formatNumber(stats.completionRate)}%` },
        ];
    }

    if (selectedTab === 'notes') {
        const stats = getNoteDashboardStats();
        return [
            { label: 'Total Notes', value: formatNumber(stats.totalNotes) },
            { label: 'Notes Created Today', value: formatNumber(stats.notesCreatedToday) },
            { label: 'Notes Updated This Week', value: formatNumber(stats.notesUpdatedThisWeek) },
            { label: 'Newest Note', value: stats.latestNote ? stats.latestNote.noteTitle : 'None' },
            { label: 'Oldest Note', value: stats.oldestNote ? stats.oldestNote.noteTitle : 'None' },
            { label: 'Updated vs Created Today', value: `${formatNumber(stats.notesUpdatedThisWeek)} / ${formatNumber(stats.notesCreatedToday)}` },
        ];
    }

    if (selectedTab === 'focus') {
        const stats = getFocusDashboardStats();
        return [
            { label: 'Total Sessions', value: formatNumber(stats.totalSessions) },
            { label: 'Total Focus Time', value: formatMinutes(stats.totalFocusTime) },
            { label: 'Average Session', value: formatMinutes(Math.round(stats.averageDuration)) },
            { label: 'Sessions Today', value: formatNumber(stats.completedToday) },
            { label: 'Focus Time This Week', value: formatMinutes(stats.focusTimeThisWeek) },
            { label: 'Latest Session', value: stats.latestSession ? stats.latestSession.sessionName || 'Focus Session' : 'None' },
        ];
    }

    if (selectedTab === 'expenses') {
        const stats = getExpenseDashboardStats();
        return [
            { label: 'Total Expenses', value: formatNumber(stats.totalCount) },
            { label: 'Total Spent', value: formatCurrency(stats.totalAmount) },
            { label: 'This Month Spending', value: formatCurrency(stats.thisMonthAmount) },
            { label: 'Average Expense', value: formatCurrency(stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0) },
            { label: 'Highest Expense', value: stats.highestExpenseTitle },
            { label: 'Top Category', value: stats.topCategory || 'N/A' },
        ];
    }

    const allStats = getAllDashboardStats();
    return [
        { label: 'Total Tasks', value: formatNumber(allStats.tasks.totalTasks) },
        { label: 'Completed Tasks', value: formatNumber(allStats.tasks.completedTasks) },
        { label: 'Total Notes', value: formatNumber(allStats.notes.totalNotes) },
        { label: 'Total Expenses', value: formatNumber(allStats.expenses.totalCount) },
        { label: 'This Month Spending', value: formatCurrency(allStats.expenses.thisMonthAmount) },
        { label: 'Total Focus Sessions', value: formatNumber(allStats.focus.totalSessions) },
    ];
}

export function renderDashboardStats(tabName = currentDashboardTab) {
    const cardData = getStatsForDashboardTab(tabName);
    const cards = Array.from(document.querySelectorAll('.dashboard-stats-grid .stat-card'));
    if (cards.length === 0) {
        return;
    }

    cards.forEach((card, index) => {
        const stat = cardData[index] || { label: '', value: '' };
        const titleEl = card.querySelector('h3');
        const valueEl = card.querySelector('p');
        if (titleEl) {
            titleEl.textContent = stat.label;
        }
        if (valueEl) {
            valueEl.textContent = stat.value;
        }
    });
}

export function setActiveDashboardTab(tabName) {
    const tabList = document.getElementById('dashboard-tab-list');
    if (!tabList) {
        return;
    }

    const tabButtons = Array.from(tabList.querySelectorAll('.tab-btn'));
    tabButtons.forEach((button) => {
        const isActive = button.dataset.dashboardTab === tabName;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    currentDashboardTab = tabName;
    renderDashboardStats(tabName);
    renderRecentActivities(tabName);
    renderDashboardInsights(tabName);
}

export function handleDashboardTabClick(event) {
    const tabButton = event.target.closest('[data-dashboard-tab]');
    if (!tabButton || !event.currentTarget.contains(tabButton)) {
        return;
    }

    const tabName = tabButton.dataset.dashboardTab;
    if (!tabName || tabName === currentDashboardTab) {
        return;
    }

    event.preventDefault();
    setActiveDashboardTab(tabName);
}

export function initDashboardTabs() {
    const tabList = document.getElementById('dashboard-tab-list');
    if (!tabList) {
        return;
    }
    tabList.addEventListener('click', handleDashboardTabClick);
    setActiveDashboardTab(currentDashboardTab);
}

function sortActivitiesNewestFirst(activities) {
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function normalizeTaskActivity(task, type, timestamp) {
    return {
        module: 'tasks',
        type,
        title: task.taskTitle,
        timestamp,
    };
}

function normalizeNoteActivity(note, type, timestamp) {
    return {
        module: 'notes',
        type,
        title: note.noteTitle,
        timestamp,
    };
}

function normalizeFocusActivity(session) {
    return {
        module: 'focus',
        type: 'session_completed',
        title: session.sessionName || 'Focus Session',
        timestamp: session.completedAt,
    };
}

function normalizeExpenseActivity(expense, type, timestamp) {
    return {
        module: 'expenses',
        type,
        title: expense.expenseTitle,
        timestamp,
    };
}

export function getTaskDashboardStats() {
    return getTaskStats();
}

export function getNoteDashboardStats() {
    return getNoteStats();
}

export function getFocusDashboardStats() {
    const sessions = AppState.focusSessions || [];
    const completedSessions = sessions.filter((session) => session.completedAt);
    const totalSessions = sessions.length;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedToday = completedSessions.filter((session) => {
        return new Date(session.completedAt).toDateString() === new Date().toDateString();
    }).length;
    const completedThisWeek = completedSessions.filter((session) => new Date(session.completedAt) >= oneWeekAgo).length;
    const totalFocusTime = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
    const focusTimeThisWeek = completedSessions
        .filter(session => new Date(session.completedAt) >= oneWeekAgo)
        .reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
    const averageDuration = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
    const latestSession = completedSessions.slice().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] || null;

    return {
        totalSessions,
        totalFocusTime,
        completedToday,
        completedThisWeek,
        focusTimeThisWeek,
        averageDuration,
        latestSession,
    };
}

export function getExpenseDashboardStats() {
    const stats = getExpenseStats();
    const highestExpense = (AppState.expenses || []).slice().sort((a, b) => (b.expenseAmount || 0) - (a.expenseAmount || 0))[0] || null;
    return {
        ...stats,
        highestExpenseTitle: highestExpense ? highestExpense.expenseTitle : 'None',
    };
}

export function getAllDashboardStats() {
    return {
        tasks: getTaskDashboardStats(),
        notes: getNoteDashboardStats(),
        focus: getFocusDashboardStats(),
        expenses: getExpenseDashboardStats(),
    };
}

export function getTaskRecentActivities() {
    const activities = [];
    for (const task of AppState.tasks) {
        if (task.createdAt) {
            activities.push(normalizeTaskActivity(task, 'created', task.createdAt));
        }
        if (task.completedAt) {
            activities.push(normalizeTaskActivity(task, 'completed', task.completedAt));
        }
        if (task.updatedAt) {
            activities.push(normalizeTaskActivity(task, 'updated', task.updatedAt));
        }
    }
    return sortActivitiesNewestFirst(activities).slice(0, 10);
}

export function getNoteRecentActivities() {
    const activities = [];
    for (const note of AppState.notes) {
        if (note.createdAt) {
            activities.push(normalizeNoteActivity(note, 'created', note.createdAt));
        }
        if (note.updatedAt) {
            activities.push(normalizeNoteActivity(note, 'updated', note.updatedAt));
        }
    }
    return sortActivitiesNewestFirst(activities).slice(0, 10);
}

export function getFocusRecentActivities() {
    const activities = (AppState.focusSessions || [])
        .filter((session) => session.completedAt)
        .map((session) => normalizeFocusActivity(session));
    return sortActivitiesNewestFirst(activities).slice(0, 10);
}

export function getExpenseRecentActivities() {
    const activities = [];
    for (const expense of AppState.expenses) {
        if (expense.createdAt) {
            activities.push(normalizeExpenseActivity(expense, 'created', expense.createdAt));
        }
        if (expense.updatedAt) {
            activities.push(normalizeExpenseActivity(expense, 'updated', expense.updatedAt));
        }
    }
    return sortActivitiesNewestFirst(activities).slice(0, 10);
}

export function getAllRecentActivities() {
    return sortActivitiesNewestFirst([
        ...getTaskRecentActivities(),
        ...getNoteRecentActivities(),
        ...getFocusRecentActivities(),
        ...getExpenseRecentActivities(),
    ]).slice(0, 10);
}

export function getRecentActivitiesForTab(tabName = currentDashboardTab) {
    const selectedTab = tabName || currentDashboardTab || DEFAULT_DASHBOARD_TAB;
    if (selectedTab === 'tasks') {
        return getTaskRecentActivities();
    }
    if (selectedTab === 'notes') {
        return getNoteRecentActivities();
    }
    if (selectedTab === 'focus') {
        return getFocusRecentActivities();
    }
    if (selectedTab === 'expenses') {
        return getExpenseRecentActivities();
    }
    return getAllRecentActivities();
}

function getActivityActionText(type) {
    switch (type) {
        case 'created':
            return 'Created';
        case 'completed':
            return 'Completed';
        case 'updated':
            return 'Updated';
        case 'session_completed':
            return 'Focus Session Completed';
        default:
            return type.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    }
}

export function getTaskInsights() {
    return getDashboardInsights();
}

export function getNoteInsights() {
    const stats = getNoteStats();
    const mostRecentlyEditedNote = AppState.notes.slice()
        .filter((note) => note.updatedAt)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;

    return {
        notesCreatedToday: stats.notesCreatedToday,
        notesUpdatedThisWeek: stats.notesUpdatedThisWeek,
        oldestNote: stats.oldestNote,
        latestNote: stats.latestNote,
        mostRecentlyEditedNote,
    };
}

export function getFocusInsights() {
    const sessions = AppState.focusSessions || [];
    const completedSessions = sessions.filter((session) => session.completedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sessionsThisWeek = completedSessions.filter((session) => new Date(session.completedAt) >= oneWeekAgo).length;
    const totalSessions = sessions.length;
    const totalFocusTime = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
    const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
    const longestSession = sessions.slice().sort((a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0))[0] || null;
    const latestSession = completedSessions.slice().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] || null;

    return {
        totalSessions,
        sessionsThisWeek,
        longestSession,
        latestSession,
        totalFocusTime,
        averageSessionLength,
    };
}

export function getExpenseInsights() {
    const stats = getExpenseStats();
    const expenses = AppState.expenses || [];
    const highestExpense = expenses.slice().sort((a, b) => (b.expenseAmount || 0) - (a.expenseAmount || 0))[0] || null;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const spendingThisWeek = expenses.filter((expense) => {
        if (!expense.expenseDate) return false;
        const expenseDate = new Date(expense.expenseDate);
        return expenseDate >= oneWeekAgo;
    }).reduce((sum, expense) => sum + (expense.expenseAmount || 0), 0);

    return {
        totalAmount: stats.totalAmount,
        thisMonthAmount: stats.thisMonthAmount,
        topCategory: stats.topCategory,
        highestExpense,
        averageExpense: stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0,
        spendingThisWeek,
    };
}

export function getAllInsights() {
    return {
        tasks: getTaskInsights(),
        notes: getNoteInsights(),
        focus: getFocusInsights(),
        expenses: getExpenseInsights(),
    };
}

export function getInsightsForTab(tabName = currentDashboardTab) {
    const selectedTab = tabName || currentDashboardTab || DEFAULT_DASHBOARD_TAB;
    if (selectedTab === 'tasks') {
        return getTaskInsights();
    }
    if (selectedTab === 'notes') {
        return getNoteInsights();
    }
    if (selectedTab === 'focus') {
        return getFocusInsights();
    }
    if (selectedTab === 'expenses') {
        return getExpenseInsights();
    }

    const allInsights = getAllInsights();
    const tasks = allInsights.tasks;
    const notes = allInsights.notes;
    const focus = getFocusDashboardStats();
    const expenses = allInsights.expenses;

    const taskActivityThisWeek = tasks.tasksCompletedThisWeek || 0;
    const focusHoursThisWeek = focus.focusTimeThisWeek || 0;

    return {
        mostActiveModuleThisWeek: (() => {
            const counts = {
                tasks: taskActivityThisWeek,
                notes: (notes.notesCreatedToday || 0) + (notes.notesUpdatedThisWeek || 0),
                focus: focus.completedThisWeek || 0,
                expenses: (expenses.totalCount || 0),
            };
            const winner = Object.keys(counts).reduce((best, key) => {
                return counts[key] > counts[best] ? key : best;
            }, 'tasks');
            return winner.charAt(0).toUpperCase() + winner.slice(1);
        })(),
        highestSpendingCategory: expenses.topCategory || 'N/A',
        totalFocusHoursThisWeek: focusHoursThisWeek,
        tasksCompletedThisWeek: taskActivityThisWeek,
    };
}

export function renderRecentActivities(tabName = currentDashboardTab) {
    const activityContainer = document.getElementById('recent-activity-list');
    if (!activityContainer) {
        return;
    }
    const activities = getRecentActivitiesForTab(tabName);
    if (activities.length === 0) {
        activityContainer.innerHTML = '<p class="no-activity">No recent activity for this tab.</p>';
        return;
    }

    const activityHTML = activities.map(activity => {
        const actionText = getActivityActionText(activity.type);
        const moduleLabel = activity.module
            ? `<span class="activity-module activity-module--${escapeHTML(activity.module)}">${escapeHTML(activity.module)}</span>`
            : '';
        const dateText = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown Date';
        return `
            <div class="activity-item">
                <div class="activity-item-header">
                    <strong>${escapeHTML(actionText)}</strong>
                    ${moduleLabel}
                </div>
                <p class="activity-title">${escapeHTML(activity.title)}</p>
                <p class="activity-date">${dateText}</p>
            </div>
        `;
    }).join('');
    activityContainer.innerHTML = activityHTML;
}


export function getDashboardInsights() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tasksCreatedThisWeek = AppState.tasks.filter(task => {
        if (!task.createdAt) return false;
        const createdDate = new Date(task.createdAt);
        return createdDate >= oneWeekAgo;
    }).length;

    const tasksCompletedThisWeek = AppState.tasks.filter(task => {
        if (!task.isComplete) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= oneWeekAgo;
    }).length;

    const oldestPendingTask = AppState.tasks
        .filter(task => !task.isComplete)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    const latestCompletedTask = AppState.tasks
        .filter(task => task.isComplete)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

    return {
        tasksCreatedThisWeek,
        tasksCompletedThisWeek,
        oldestPendingTask,
        latestCompletedTask
    };
}


export function renderDashboardInsights(tabName = currentDashboardTab) {
    const insights = getInsightsForTab(tabName);
    const insightsContainer = document.getElementById('dashboard-insights-list');
    if (!insightsContainer) {
        return;
    }

    if (!insights || Object.keys(insights).length === 0) {
        insightsContainer.innerHTML = '<p class="no-insights">No insights available yet.</p>';
        return;
    }

    const insightItems = [];

    if (tabName === 'tasks') {
        insightItems.push(
            { label: 'Tasks Created This Week', value: formatNumber(insights.tasksCreatedThisWeek) },
            { label: 'Tasks Completed This Week', value: formatNumber(insights.tasksCompletedThisWeek) },
            { label: 'Oldest Pending Task', value: insights.oldestPendingTask ? insights.oldestPendingTask.taskTitle : 'None' },
            { label: 'Latest Completed Task', value: insights.latestCompletedTask ? insights.latestCompletedTask.taskTitle : 'None' },
        );
    } else if (tabName === 'notes') {
        insightItems.push(
            { label: 'Notes Created Today', value: formatNumber(insights.notesCreatedToday) },
            { label: 'Notes Updated This Week', value: formatNumber(insights.notesUpdatedThisWeek) },
            { label: 'Most Recently Edited Note', value: insights.mostRecentlyEditedNote ? insights.mostRecentlyEditedNote.noteTitle : 'None' },
            { label: 'Oldest Note', value: insights.oldestNote ? insights.oldestNote.noteTitle : 'None' },
        );
    } else if (tabName === 'focus') {
        insightItems.push(
            { label: 'Focus Hours This Week', value: formatMinutes(insights.totalFocusTime ? Math.round(insights.totalFocusTime) : 0) },
            { label: 'Longest Session', value: insights.longestSession ? `${insights.longestSession.sessionName || 'Focus Session'} (${formatMinutes(insights.longestSession.durationMinutes)})` : 'None' },
            { label: 'Average Session Length', value: formatMinutes(Math.round(insights.averageSessionLength || 0)) },
            { label: 'Sessions This Week', value: formatNumber(insights.sessionsThisWeek) },
        );
    } else if (tabName === 'expenses') {
        insightItems.push(
            { label: 'Highest Expense', value: insights.highestExpense ? insights.highestExpense.expenseTitle : 'None' },
            { label: 'Top Category', value: insights.topCategory || 'N/A' },
            { label: 'Spending This Week', value: formatCurrency(insights.spendingThisWeek || 0) },
            { label: 'Spending This Month', value: formatCurrency(insights.thisMonthAmount || 0) },
        );
    } else {
        insightItems.push(
            { label: 'Most Active Module This Week', value: insights.mostActiveModuleThisWeek || 'N/A' },
            { label: 'Highest Spending Category', value: insights.highestSpendingCategory || 'N/A' },
            { label: 'Total Focus Hours This Week', value: formatMinutes(Math.round(insights.totalFocusHoursThisWeek || 0)) },
            { label: 'Tasks Completed This Week', value: formatNumber(insights.tasksCompletedThisWeek) },
        );
    }

    insightsContainer.innerHTML = insightItems.map(item => `
        <div class="insight-item">
            <h3>${escapeHTML(item.label)}</h3>
            <p>${escapeHTML(item.value)}</p>
        </div>
    `).join('');
}






export function initDashboardPage() {
    const tabList = document.getElementById('dashboard-tab-list');
    if (tabList) {
        initDashboardTabs();
    } else {
        renderDashboardStats();
        renderRecentActivities();
        renderDashboardInsights();
    }
}