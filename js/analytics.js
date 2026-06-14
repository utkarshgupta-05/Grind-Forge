// analytics.js
import { AppState } from './state.js';

let chartInstances = {};

export function initAnalyticsPage() {
    console.log("Analytics Page Initialized");
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                reRenderCharts();
            }
        });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    reRenderCharts();
}

function readThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        textSecondary: style.getPropertyValue('--text-secondary').trim(),
        textMuted:     style.getPropertyValue('--text-muted').trim(),
        border:        style.getPropertyValue('--border').trim(),
        success:       style.getPropertyValue('--success').trim(),
        primary:       style.getPropertyValue('--primary').trim() || '#4DAA83',
        info:          style.getPropertyValue('--info').trim() || '#9FB7D8',
        expenseAccent: style.getPropertyValue('--expense-accent').trim(),
        danger:        style.getPropertyValue('--danger').trim(),
        cardBg:        style.getPropertyValue('--card-bg').trim(),
    };
}

// --- Utility Functions ---
function getDatesArray(daysAgo) {
    const dates = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d);
    }
    return dates;
}

function getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getLocalYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function reRenderCharts() {
    AppState.load(); // Refresh data from storage
    const colors = readThemeColors();
    
    if (window.Chart) {
        Chart.defaults.color = colors.textSecondary;
        Chart.defaults.borderColor = 'rgba(135, 146, 139, 0.1)';
        Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    }
    
    Object.keys(chartInstances).forEach(key => {
        if (chartInstances[key]) {
            chartInstances[key].destroy();
        }
    });
    
    renderTaskCompletionTrend(colors);
    renderDonevsOverdue(colors);
    renderFocusHeatmap(colors);
    renderFocusDistribution(colors);
    renderBudgetBurnDown(colors);
    renderSpendingByCategory(colors);
}

export function renderTaskCompletionTrend(colors) {
    const canvasEl = document.getElementById('task-completion-chart');
    if (!canvasEl) return;

    const dates = getDatesArray(7);
    const labels = dates.map(d => getDayName(d));
    
    const dataset = dates.map(date => {
        const dateString = getLocalYYYYMMDD(date);
        return AppState.tasks.filter(t => {
            if (!t.isComplete || !t.completedAt) return false;
            return t.completedAt.startsWith(dateString); // ISO string matching
        }).length;
    });

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Task Completed",
                data: dataset,
                borderColor: colors.success,
                backgroundColor: colors.success + '33',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors.success,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    };
    chartInstances['task-completion-chart'] = new Chart(canvasEl, config);
}

export function renderDonevsOverdue(colors) {
    const canvasEl = document.getElementById('done-overdue-chart');
    if (!canvasEl) return;
    
    const dates = getDatesArray(7);
    const labels = dates.map(d => getDayName(d));
    
    const doneData = [];
    const overdueData = [];

    const todayString = getLocalYYYYMMDD(new Date());

    dates.forEach(date => {
        const dateString = getLocalYYYYMMDD(date);
        
        let doneCount = 0;
        let overdueCount = 0;

        AppState.tasks.forEach(t => {
            // Only look at tasks due on Day X
            if (!t.dueDate || !t.dueDate.startsWith(dateString)) return;

            if (t.isComplete && t.completedAt) {
                const completedDate = t.completedAt.split('T')[0];
                if (completedDate <= dateString) {
                    // Completed on or before Day X
                    doneCount++;
                } else {
                    // Completed, but after Day X (late)
                    overdueCount++;
                }
            } else {
                // Pending today. Count as overdue if Day X is in the past.
                if (dateString < todayString) {
                    overdueCount++;
                }
            }
        });

        doneData.push(doneCount);
        overdueData.push(overdueCount);
    });

    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Done',
                    data: doneData,
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                },
                {
                    label: 'Overdue',
                    data: overdueData,
                    backgroundColor: colors.danger,
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: true }
            }
        }
    };
    chartInstances['done-overdue-chart'] = new Chart(canvasEl, config);
}

export function renderFocusHeatmap(colors){
    const container = document.getElementById('focus-heatmap-container');
    if(!container) return;
    
    container.innerHTML = '';
    const colorScale = [colors.border, colors.success+'33', colors.success+'66', colors.success+'99', colors.success];
    
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    
    // Generate last 35 days (5 weeks)
    const dates = getDatesArray(35);
    
    // Calculate durations map
    const durationMap = {};
    AppState.focusSessions.forEach(session => {
        if (!session.startedAt) return;
        const dateStr = session.startedAt.split('T')[0];
        durationMap[dateStr] = (durationMap[dateStr] || 0) + (session.durationMinutes || 0);
    });

    let dayIndex = 0;
    for(let i = 1; i <= 5; i++){
        const weekLabel = document.createElement('div');
        weekLabel.className = 'heatmap-label';
        weekLabel.textContent = `W${i}`;
        grid.appendChild(weekLabel);
        
        for(let j = 1; j <= 7; j++){
            const dateObj = dates[dayIndex];
            const dateStr = getLocalYYYYMMDD(dateObj);
            const duration = durationMap[dateStr] || 0;
            
            let intensity = 0;
            if (duration > 0 && duration <= 25) intensity = 1;
            else if (duration > 25 && duration <= 60) intensity = 2;
            else if (duration > 60 && duration <= 120) intensity = 3;
            else if (duration > 120) intensity = 4;
            
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.style.backgroundColor = colorScale[intensity];
            cell.title = `${dateStr}: ${duration} mins`; // Tooltip
            grid.appendChild(cell);
            dayIndex++;
        }
    }
    container.appendChild(grid);
    container.innerHTML += `<div class="heatmap-legend">
        <span>Less</span>
        <div class="legend-scale">
            <div class="heatmap-cell" style="background-color: ${colorScale[0]}"></div>
            <div class="heatmap-cell" style="background-color: ${colorScale[1]}"></div>
            <div class="heatmap-cell" style="background-color: ${colorScale[2]}"></div>
            <div class="heatmap-cell" style="background-color: ${colorScale[3]}"></div>
            <div class="heatmap-cell" style="background-color: ${colorScale[4]}"></div>
        </div>
        <span>More</span>
    </div>`;
}

export function renderFocusDistribution(colors) {
    const canvasEl = document.getElementById('focus-distribution-chart');
    if (!canvasEl) return;

    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Buckets: 12AM, 2AM, 4AM ... 10PM (12 buckets)
    const labels = [];
    const data = Array(12).fill(0);
    
    for (let i = 0; i < 24; i += 2) {
        let hour = i;
        let suffix = hour >= 12 ? 'PM' : 'AM';
        if (hour === 0) hour = 12;
        else if (hour > 12) hour -= 12;
        labels.push(`${hour}${suffix}`);
    }

    AppState.focusSessions.forEach(session => {
        if (!session.startedAt) return;
        const started = new Date(session.startedAt);
        if (started >= sevenDaysAgo) {
            const hour = started.getHours(); // 0 - 23
            const bucketIndex = Math.floor(hour / 2);
            data[bucketIndex] += (session.durationMinutes || 0);
        }
    });

    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Focus Minutes',
                data: data,
                backgroundColor: colors.info,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    };
    chartInstances['focus-distribution-chart'] = new Chart(canvasEl, config);
}

export function renderBudgetBurnDown(colors) {
    const canvasEl = document.getElementById('budget-burn-down-chart');
    if (!canvasEl) return;

    const now = new Date();
    const currentMonthStr = getLocalYYYYMMDD(now).substring(0, 7); // "YYYY-MM"
    
    const monthlyBudget = parseFloat(AppState.settings.monthlyBudget) || 0;
    const budgetData = [monthlyBudget, monthlyBudget, monthlyBudget, monthlyBudget];
    
    // Sort expenses in current month
    const currentMonthExpenses = AppState.expenses
        .filter(e => e.expenseDate && e.expenseDate.startsWith(currentMonthStr))
        .sort((a, b) => a.expenseDate.localeCompare(b.expenseDate));

    // Calculate cumulative sum into 4 weeks approx (Days 1-7, 8-14, 15-21, 22+)
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    
    currentMonthExpenses.forEach(e => {
        const day = parseInt(e.expenseDate.split('-')[2]);
        const amt = parseFloat(e.expenseAmount) || 0;
        if (day <= 7) w1 += amt;
        else if (day <= 14) w2 += amt;
        else if (day <= 21) w3 += amt;
        else w4 += amt;
    });

    const spentData = [
        w1, 
        w1 + w2, 
        w1 + w2 + w3, 
        w1 + w2 + w3 + w4
    ];

    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Budget Limit',
                    data: budgetData,
                    borderColor: colors.textMuted,
                    borderDash: [8, 4],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Cumulative Spent',
                    data: spentData,
                    borderColor: colors.expenseAccent,
                    backgroundColor: colors.expenseAccent + '33',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    };
    chartInstances['budgetBurnDown'] = new Chart(canvasEl, config);
}

export function renderSpendingByCategory(colors) {
    const canvasEl = document.getElementById('spending-category-chart');
    if (!canvasEl) return;

    // Filter last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = getLocalYYYYMMDD(thirtyDaysAgo);

    const labels = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Other'];
    const categoryTotals = {
        'Food': 0, 'Transport': 0, 'Bills': 0, 'Shopping': 0, 'Entertainment': 0, 'Other': 0
    };

    AppState.expenses.forEach(e => {
        if (e.expenseDate && e.expenseDate >= thirtyDaysAgoStr) {
            const cat = categoryTotals.hasOwnProperty(e.expenseCategory) ? e.expenseCategory : 'Other';
            categoryTotals[cat] += (parseFloat(e.expenseAmount) || 0);
        }
    });

    const spentData = labels.map(cat => categoryTotals[cat]);

    const config = {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending (Last 30 Days)',
                data: spentData,
                borderColor: colors.expenseAccent,
                pointBackgroundColor: colors.expenseAccent,
                backgroundColor: colors.expenseAccent + '26',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(135, 146, 139, 0.1)' },
                    grid: { color: 'rgba(135, 146, 139, 0.1)' },
                    pointLabels: { color: colors.textSecondary },
                    ticks: {
                        color: colors.textMuted,
                        backdropColor: 'transparent'
                    }
                }
            }
        }
    };
    chartInstances['spendingCategory'] = new Chart(canvasEl, config);
}