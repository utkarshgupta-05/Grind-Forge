import { AppState } from "./state.js";
import {
    validateRequired,
    formatDate,
    getDaysDiff,
    escapeHTML,
} from "./utils.js";

let currentFilter = "all";
let editingTaskId = null;

export function createTask(taskData) {
    if (!taskData || typeof taskData !== "object") {
        throw new Error("Invalid task data");
    }
    if (!validateRequired(taskData.title)) {
        throw new Error("Task title is required");
    }
    let priority = taskData.priority;
    if (
        !priority ||
        (priority && !["low", "medium", "high"].includes(priority))
    ) {
        priority = "low";
    }
    let dueDate = null;
    if (taskData.dueDate) {
        const due = new Date(taskData.dueDate);
        if (isNaN(due.getTime())) {
            throw new Error("Invalid due date");
        }
        dueDate = due.toISOString();
    }
    const taskId = crypto.randomUUID();
    const newTask = {
        taskId: taskId,
        taskTitle: taskData.title,
        taskDescription: taskData.description || "",
        dueDate: dueDate,
        priority: priority,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        isComplete: false,
        completedAt: null,
    };
    AppState.tasks.push(newTask);

    AppState.save();
    return newTask;
}

export function deleteTask(taskId) {
    if (!validateRequired(taskId)) {
        throw new Error("Task ID is required for deletion");
    }
    const exists = AppState.tasks.some((task) => task.taskId === taskId);
    if (!exists) {
        throw new Error("Task not found");
    }
    AppState.tasks = AppState.tasks.filter((task) => task.taskId !== taskId);
    AppState.save();
    return true;
}

export function toggleTask(taskId) {
    if (!validateRequired(taskId)) {
        throw new Error("Task ID is required to toggle completion");
    }
    const task = AppState.tasks.find((t) => t.taskId === taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    task.isComplete = !task.isComplete;
    task.completedAt = task.isComplete ? new Date().toISOString() : null;
    AppState.save();
    return task;
}

export function getTaskFormData() {
    const titleInput = document.getElementById("task-title");
    const descriptionInput = document.getElementById("task-desc");
    const dueDateInput = document.getElementById("task-due-date");
    const priorityInput = document.getElementById("task-priority");

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim()
        ? descriptionInput.value.trim()
        : "";
    const dueDate = dueDateInput.value ? dueDateInput.value : null;
    const priority = priorityInput.value;

    return {
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
    };
}

export function handleTaskFormSubmit(event, container) {
    event.preventDefault();
    try {
        const formData = getTaskFormData();
        if (editingTaskId) {
            updateTask(editingTaskId, formData);
            editingTaskId = null;
            const submitBtn = event.target.querySelector("button.primary-btn[type='submit']");
            const cancelBtn = document.getElementById("cancel-edit-btn");
            if (submitBtn) {
                submitBtn.textContent = "Add Task";
            }
            if (cancelBtn) {
                cancelBtn.hidden = true;
            }
        } else {
            createTask(formData);
        }
        renderTasks(container, currentFilter);
        event.target.reset();

        // Hide modal overlay
        const modal = document.getElementById("add-task-modal");
        if (modal) {
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
        }
    } catch (error) {
        alert(`Error creating task: ${error.message}`);
    }
}

export function renderTasks(container, filter = "all") {
    if (!container || !(container instanceof HTMLElement)) {
        throw new Error("Valid container element is required");
    }

    if (AppState.tasks.length === 0) {
        container.innerHTML =
            "<div class='empty-state'><h3>No Tasks Yet</h3><p>Create your first task.</p></div>";
        renderTaskStats();
        return;
    }

    let tasksToRender = AppState.tasks;
    tasksToRender.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (filter === "completed") {
        tasksToRender = tasksToRender.filter((task) => task.isComplete);
        if (tasksToRender.length === 0) {
            container.innerHTML =
                "<div class='empty-state'><h3>No Completed Tasks</h3><p>Complete some tasks to see them here.</p></div>";
            renderTaskStats();
            return;
        }
    } else if (filter === "overdue") {
        tasksToRender = tasksToRender.filter(
            (task) =>
                task.dueDate &&
                getDaysDiff(task.dueDate, new Date()) < 0 &&
                !task.isComplete,
        );
        if (tasksToRender.length === 0) {
            container.innerHTML =
                "<div class='empty-state'><h3>No Overdue Tasks</h3><p>All tasks are either completed or not yet due.</p></div>";
            renderTaskStats();
            return;
        }
    } else if (filter === "pending") {
        tasksToRender = tasksToRender.filter(
            (task) =>
                !task.isComplete &&
                (!task.dueDate || getDaysDiff(task.dueDate, new Date()) >= 0),
        );
        if (tasksToRender.length === 0) {
            container.innerHTML =
                "<div class='empty-state'><h3>No Pending Tasks</h3><p>All tasks are either completed or overdue.</p></div>";
            renderTaskStats();
            return;
        }
    }
    const tasksHTML = tasksToRender
        .map(
            (task) => `
        <article class="task-card" data-task-id="${escapeHTML(task.taskId)}" data-priority="${escapeHTML(task.priority.toLowerCase())}" data-completed="${task.isComplete}">
                  <div class="task-card-header">
                    <div class="task-checkbox-wrapper">
                      <input type="checkbox" class="custom-task-checkbox" id="task-${escapeHTML(task.taskId)}-status" name="task-${escapeHTML(task.taskId)}-status" ${task.isComplete ? "checked" : ""} data-action="toggle">
                      <label for="task-${escapeHTML(task.taskId)}-status" class="visually-hidden">Mark as Complete</label>
                    </div>
                    <h3 class="task-title">${escapeHTML(task.taskTitle)}</h3>
                  </div>
                  <div class="task-card-body">
                    <p class="task-description">${escapeHTML(task.taskDescription)}</p>
                  </div>
                  <div class="task-card-footer">
                    <div class="task-meta">
                      <span class="task-due-date"><strong>Due:</strong> ${task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                      <span class="task-priority-badge"><strong>Priority:</strong> ${escapeHTML(task.priority)}</span>
                    </div>
                    <div class="task-actions">
                      <button type="button" class="edit-btn" data-action="edit">Edit</button>
                      <button type="button" class="delete-btn" data-action="delete">Delete</button>
                    </div>
                  </div>
                </article>
    `,
        )
        .join("");
    container.innerHTML = tasksHTML;
    renderTaskStats();
}

export function initTasksPage() {
    const form = document.getElementById("task-form");
    const container = document.getElementById("task-list-container");
    const tabsContainer = document.querySelector(".task-tabs");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    
    // Add New Task trigger button click handler
    const openModalBtn = document.getElementById("open-add-task-btn");
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            editingTaskId = null;
            const formEl = document.getElementById("task-form");
            if (formEl) {
                formEl.reset();
            }
            const titleText = document.getElementById("modal-title-text");
            if (titleText) {
                titleText.textContent = "Create a New Task";
            }
            const submitBtn = document.querySelector("button.primary-btn[type='submit']");
            if (submitBtn) {
                submitBtn.textContent = "Add Task";
            }
            const cancelBtn = document.getElementById("cancel-edit-btn");
            if (cancelBtn) {
                cancelBtn.hidden = true;
            }
            
            const modal = document.getElementById("add-task-modal");
            if (modal) {
                modal.style.display = "flex";
                modal.setAttribute("aria-hidden", "false");
                const titleInput = document.getElementById("task-title");
                if (titleInput) {
                    titleInput.focus();
                }
            }
        });
    }

    // Modal Close buttons click handlers
    const closeModalBtn = document.getElementById("close-modal-btn");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            cancelEditingTask();
        });
    }

    const modalOverlay = document.getElementById("add-task-modal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (event) => {
            if (event.target === modalOverlay) {
                cancelEditingTask();
            }
        });
    }

    // Dismiss modal on Escape key
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            const modal = document.getElementById("add-task-modal");
            if (modal && modal.style.display === "flex") {
                cancelEditingTask();
            }
        }
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            cancelEditingTask();
        });
    }
    if (tabsContainer) {
        tabsContainer.addEventListener("click", (event) => {
            handleTaskFilterClick(event, container);
        });

        if (!form || !container) return;

        form.addEventListener("submit", (event) => {
            handleTaskFormSubmit(event, container);
        });

        container.addEventListener("click", (event) => {
            handleTaskListClick(event, container);
        });

        renderTasks(container, currentFilter);
    }
}

function handleTaskListClick(event, container) {
    const action = event.target.dataset.action;
    if (!action) {
        return;
    }

    const taskCard = event.target.closest("[data-task-id]");
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;

    try {
        if (action === "edit") {
            startEditingTask(taskId);
        }

        if (action === "delete") {
            deleteTask(taskId);
            renderTasks(container, currentFilter);
        }

        if (action === "toggle") {
            toggleTask(taskId);
            renderTasks(container, currentFilter);
        }
    } catch (error) {
        alert(error.message);
    }
}

function handleTaskFilterClick(event, container) {
    const filter = event.target.dataset.filter;
    if (!filter) return;
    const tabButtons = document.querySelectorAll(".tab-btn");
    tabButtons.forEach((btn) => {
        btn.classList.remove("active");
    });
    const clickedButton = event.target.closest(".tab-btn");
    if (!clickedButton) return;
    clickedButton.classList.add("active");
    currentFilter = filter;
    renderTasks(container, currentFilter);
}

export function startEditingTask(taskId) {
    const task = AppState.tasks.find((task) => task.taskId === taskId);
    if (!task) {
        throw new Error("Task not found");
    }
    editingTaskId = taskId;
    
    // Set form fields
    document.getElementById("task-title").value = task.taskTitle;
    document.getElementById("task-desc").value = task.taskDescription ? task.taskDescription : "";
    document.getElementById("task-due-date").value = task.dueDate ? task.dueDate.split("T")[0] : "";
    document.getElementById("task-priority").value = task.priority;

    // Set modal text
    const titleText = document.getElementById("modal-title-text");
    if (titleText) {
        titleText.textContent = "Edit Task";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = false;
    }
    const submitBtn = document.querySelector("button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Update Task";
    }

    // Show modal overlay
    const modal = document.getElementById("add-task-modal");
    if (modal) {
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
    }
}

export function updateTask(taskId, taskData) {
    const task = AppState.tasks.find((task) => task.taskId === taskId);
    if (!task) {
        throw new Error("Task not found");
    }

    if (!taskData || typeof taskData !== "object") {
        throw new Error("Invalid task data");
    }
    if (!validateRequired(taskData.title)) {
        throw new Error("Task title is required");
    }
    let priority = taskData.priority;
    if (
        !priority ||
        (priority && !["low", "medium", "high"].includes(priority))
    ) {
        priority = "low";
    }
    let dueDate = null;
    if (taskData.dueDate) {
        const due = new Date(taskData.dueDate);
        if (isNaN(due.getTime())) {
            throw new Error("Invalid due date");
        }
        dueDate = due.toISOString();
    }
    const updatedTask = {
        taskTitle: taskData.title,
        taskDescription: taskData.description || "",
        dueDate: dueDate,
        priority: priority,
        updatedAt: new Date().toISOString(),
    };
    Object.assign(task, updatedTask);
    AppState.save();
    return task;
}




export function cancelEditingTask() {
    editingTaskId = null;
    const form = document.getElementById("task-form");
    if (form) {
        form.reset();
    }
    const titleText = document.getElementById("modal-title-text");
    if (titleText) {
        titleText.textContent = "Create a New Task";
    }
    const submitBtn = document.querySelector("button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Add Task";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = true;
    }

    // Hide modal overlay
    const modal = document.getElementById("add-task-modal");
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
}




export function getTaskStats() {
    const tasks = AppState.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.isComplete).length;
    const overdueTasks = tasks.filter(
        (task) =>
            task.dueDate &&
            getDaysDiff(task.dueDate, new Date()) < 0 &&
            !task.isComplete,
    ).length;
    const pendingTasks = totalTasks - completedTasks - overdueTasks;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    const completedToday = tasks.filter((task) => {
        if (!task.isComplete || !task.completedAt) {
            return false;
        }
        return (new Date(task.completedAt).toDateString() === new Date().toDateString());
    }).length;


    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        completedToday,
    };
}

export function renderTaskStats() {
    const stats = getTaskStats();
    const totalTasksEl = document.getElementById("total-tasks-count");

    const pendingTasksEl = document.getElementById("pending-tasks-count");

    const overdueTasksEl = document.getElementById("overdue-tasks-count");

    const completedTasksEl = document.getElementById("completed-tasks-count");

    const completionRateEl = document.getElementById("completion-rate");

    const progressFillEl = document.getElementById("completion-progress");

    if (!totalTasksEl || !pendingTasksEl || !overdueTasksEl || !completedTasksEl || !completionRateEl || !progressFillEl) {
        return;
    }
    totalTasksEl.textContent = stats.totalTasks;

    pendingTasksEl.textContent = stats.pendingTasks;

    overdueTasksEl.textContent = stats.overdueTasks;

    completedTasksEl.textContent = stats.completedTasks;

    completionRateEl.textContent = `${stats.completionRate}%`;
    progressFillEl.style.width = `${stats.completionRate}%`;
}

