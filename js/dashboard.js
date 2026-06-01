import { getTaskStats } from './tasks.js';
import { AppState } from './state.js';

export function renderDashboardStats() {
    const stats = getTaskStats();
    const totalTasksEl = document.getElementById('dashboard-total-tasks');
    const completedTasksEl = document.getElementById('dashboard-completed-tasks');
    const pendingTasksEl = document.getElementById('dashboard-pending-tasks');
    const overdueTasksEl = document.getElementById('dashboard-overdue-tasks');
    const completedTodayEl = document.getElementById('dashboard-completed-today');
    const completionRateEl = document.getElementById('dashboard-completion-rate');

    if (!totalTasksEl || !completedTasksEl || !pendingTasksEl || !overdueTasksEl || !completedTodayEl || !completionRateEl) {
        return;
    }
    totalTasksEl.textContent = stats.totalTasks;
    completedTasksEl.textContent = stats.completedTasks;
    pendingTasksEl.textContent = stats.pendingTasks;
    overdueTasksEl.textContent = stats.overdueTasks;
    completedTodayEl.textContent = stats.completedToday;
    completionRateEl.textContent = `${stats.completionRate}%`;
}

export function getRecentActivities() {
    const activities = [];

    for (const task of AppState.tasks) {
        if (task.createdAt) {
            activities.push({ type: 'created', taskId: task.taskId, taskTitle: task.taskTitle, date: new Date(task.createdAt) });
        }
        if (task.completedAt) {
            activities.push({ type: 'completed', taskId: task.taskId, taskTitle: task.taskTitle, date: new Date(task.completedAt) });
        }
        if (task.updatedAt) {
            activities.push({ type: 'updated', taskId: task.taskId, taskTitle: task.taskTitle, date: new Date(task.updatedAt) });
        }
    }
    activities.sort((a, b) => b.date - a.date);
    return activities.slice(0, 10);
}

export function renderRecentActivities() {
    const activityContainer = document.getElementById('recent-activity-list');
    if (!activityContainer) {
        return;
    }
    const activities = getRecentActivities();
    if (activities.length === 0) {
        activityContainer.innerHTML = '<p class="no-activity">No recent activity</p>';
        return;
    }

    const activityHTML = activities.map(activity => {
        let actionText = "";
        if (activity.type === 'created') {
            actionText = 'Created Task';
        }
        if (activity.type === 'completed') {
            actionText = 'Completed Task';
        }
        if (activity.type === 'updated') {
            actionText = 'Updated Task';
        }
        return `
            <div class="activity-item">
                <p><strong>${actionText}:</strong> ${activity.taskTitle}</p>
                <p class="activity-date">${activity.date.toLocaleString()}</p>
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


export function renderDashboardInsights() {
    const insights = getDashboardInsights();
    const insightsContainer = document.getElementById('dashboard-insights-list');
    if (!insightsContainer) {
        return;
    }
    insightsContainer.innerHTML = `
        <div class="insight-item">
            <h3>Tasks Created This Week</h3>
                <p>${insights.tasksCreatedThisWeek}</p>
        </div>

        <div class="insight-item">
            <h3>Tasks Completed This Week</h3>
            <p>${insights.tasksCompletedThisWeek}</p>
        </div>

        <div class="insight-item">
            <h3>Oldest Pending Task</h3>
            <p>${insights.oldestPendingTask ? insights.oldestPendingTask.taskTitle : 'None'}</p>
        </div>

        <div class="insight-item">
            <h3>Latest Completed Task</h3>
            <p>${insights.latestCompletedTask ? insights.latestCompletedTask.taskTitle : 'None'}</p>
        </div>
    `;
}






export function initDashboardPage() {
    renderDashboardStats();
    renderRecentActivities();
    renderDashboardInsights();
}