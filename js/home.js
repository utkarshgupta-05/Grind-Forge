import { getTaskStats } from "./tasks.js";




export function initHomePage() {
    renderHomeStats();
}



export function renderHomeStats() {
    const stats = getTaskStats();
    const totalTasksEl = document.getElementById("home-total-tasks");

    const completedTodayEl = document.getElementById("home-completed-today");

    const pendingTasksEl = document.getElementById("home-pending-tasks");
    
    if(!totalTasksEl || !completedTodayEl || !pendingTasksEl) {
        return;
    }

    totalTasksEl.textContent = stats.totalTasks;
    completedTodayEl.textContent = stats.completedToday;
    pendingTasksEl.textContent = stats.pendingTasks;

}


