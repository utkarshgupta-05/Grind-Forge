import { AppState } from "./state.js";
import { validateRequired, formatCurrency, formatDate, escapeHTML, parseLocalDate } from "./utils.js";
import { getSettingMonthlyBudget } from "./settings.js";

let currentFilter = 'all';
let editingExpenseId = null;

export function cancelEditingExpense() {
    editingExpenseId = null;
    const form = document.getElementById("expense-form");
    if (form) {
        form.reset();
    }
    const titleText = document.getElementById("modal-title-text");
    if (titleText) {
        titleText.textContent = "Add a New Expense";
    }
    const submitBtn = document.querySelector("button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Add Expense";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = true;
    }

    // Hide modal overlay
    const modal = document.getElementById("add-expense-modal");
    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
}

export function initExpensesPage() {
    const form = document.getElementById("expense-form");
    const expenseListContainer = document.getElementById("expense-list-container");
    const filterSelect = document.getElementById("expense-category-filter");
    const breakdownContainer = document.getElementById("category-breakdown-container");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");

    // Add New Task trigger button click handler
    const openModalBtn = document.getElementById("open-add-expense-btn");
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            editingExpenseId = null;
            const formEl = document.getElementById("expense-form");
            if (formEl) {
                formEl.reset();
            }
            const titleText = document.getElementById("modal-title-text");
            if (titleText) {
                titleText.textContent = "Add a New Expense";
            }
            const submitBtn = document.querySelector("button.primary-btn[type='submit']");
            if (submitBtn) {
                submitBtn.textContent = "Add Expense";
            }
            const cancelBtn = document.getElementById("cancel-edit-btn");
            if (cancelBtn) {
                cancelBtn.hidden = true;
            }

            const modal = document.getElementById("add-expense-modal");
            if (modal) {
                modal.style.display = "flex";
                modal.setAttribute("aria-hidden", "false");
                const titleInput = document.getElementById("expense-title");
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
            cancelEditingExpense();
        });
    }

    const modalOverlay = document.getElementById("add-expense-modal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (event) => {
            if (event.target === modalOverlay) {
                cancelEditingExpense();
            }
        });
    }

    // Dismiss modal on Escape key
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            const modal = document.getElementById("add-expense-modal");
            if (modal && modal.style.display === "flex") {
                cancelEditingExpense();
            }
        }
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            cancelEditingExpense();
        });
    }
    if (!form || !expenseListContainer || !filterSelect) {
        return;
    }
    renderExpenseList(expenseListContainer, currentFilter);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        handleFormSubmit(expenseListContainer);
    });
    filterSelect.addEventListener("change", (event) => {
        const filter = event.target.value;
        currentFilter = filter;
        renderExpenseList(expenseListContainer, currentFilter);
    });
    expenseListContainer.addEventListener("click", (event) => {
        handleExpenseListClick(event, expenseListContainer);
    });
    renderCategoryBreakdown(breakdownContainer);
}

export function handleFormSubmit(container) {
    try {
        const formData = getExpenseFormData();
        if (editingExpenseId) {
            updateExpense(editingExpenseId, formData);
            editingExpenseId = null;
            const submitBtn = document.querySelector("#expense-form button.primary-btn[type='submit']");
            if (submitBtn) {
                submitBtn.textContent = "Add Expense";
            }
        } else {
            createExpense(formData);
        }
        document.getElementById("expense-form").reset();
        renderExpenseList(container, currentFilter);

        // Hide modal overlay
        const modal = document.getElementById("add-expense-modal");
        if (modal) {
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
        }
    } catch (error) {
        alert(`Error handling form submit: ${error.message}`);
    }
}

export function updateExpense(expenseId, expenseData) {
    const expense = AppState.expenses.find((e) => e.expenseId === expenseId);
    if (!expense) {
        throw new Error("Expense not found");
    }
    if (!expenseData || typeof expenseData !== "object") {
        throw new Error("Invalid expense data");
    }
    if (!validateRequired(expenseData.title)) {
        throw new Error("Expense title is required");
    }
    if (isNaN(parseFloat(expenseData.amount)) || parseFloat(expenseData.amount) <= 0) {
        throw new Error("Expense amount must be a valid positive number");
    }
    expense.expenseTitle = expenseData.title;
    expense.expenseAmount = parseFloat(expenseData.amount);
    expense.expenseCategory = expenseData.category;
    expense.expenseDate = expenseData.expenseDate;
    expense.updatedAt = new Date().toISOString();
    AppState.save();
    return expense;
}

export function startEditingExpense(expenseId) {
    const expense = AppState.expenses.find((e) => e.expenseId === expenseId);
    if (!expense) {
        throw new Error("Expense not found");
    }
    editingExpenseId = expenseId;
    document.getElementById("expense-title").value = expense.expenseTitle;
    document.getElementById("expense-amount").value = expense.expenseAmount;
    document.getElementById("expense-category").value = expense.expenseCategory;
    document.getElementById("expense-date").value = expense.expenseDate;
    // Set modal text
    const titleText = document.getElementById("modal-title-text");
    if (titleText) {
        titleText.textContent = "Edit Expense";
    }
    const cancelBtn = document.getElementById("cancel-edit-btn");
    if (cancelBtn) {
        cancelBtn.hidden = false;
    }
    const submitBtn = document.querySelector("button.primary-btn[type='submit']");
    if (submitBtn) {
        submitBtn.textContent = "Update Expense";
    }
    // Show modal overlay
    const modal = document.getElementById("add-expense-modal");
    if (modal) {
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
    }
}

export function createExpense(expenseData) {
    if (!expenseData || typeof expenseData !== "object") {
        throw new Error("Invalid expense data");
    }
    if (!validateRequired(expenseData.title)) {
        throw new Error("Expense title is required");
    }
    if (isNaN(parseFloat(expenseData.amount)) || parseFloat(expenseData.amount) <= 0) {
        throw new Error("Expense amount must be a valid positive number");
    }
    const expenseId = crypto.randomUUID();
    const newExpense = {
        expenseId: expenseId,
        expenseTitle: expenseData.title,
        expenseAmount: parseFloat(expenseData.amount),
        expenseCategory: expenseData.category,
        expenseDate: expenseData.expenseDate,
        createdAt: new Date().toISOString(),
        updatedAt: null,
    };
    AppState.expenses.push(newExpense);
    AppState.save();
    return newExpense;
}

export function deleteExpense(expenseId) {
    if (!validateRequired(expenseId)) {
        throw new Error("Expense ID is required for deletion");
    }
    const exists = AppState.expenses.some((expense) => expense.expenseId === expenseId);
    if (!exists) {
        throw new Error("Expense not found");
    }
    AppState.expenses = AppState.expenses.filter((expense) => expense.expenseId !== expenseId);
    AppState.save();
    return true;
}

export function getExpenseFormData() {
    const titleInput = document.getElementById("expense-title");
    const amountInput = document.getElementById("expense-amount");
    const categoryInput = document.getElementById("expense-category");
    const dateInput = document.getElementById("expense-date");
    if (!titleInput || !amountInput || !categoryInput || !dateInput) {
        throw new Error("All fields are required");
    }
    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);
    if (!validateRequired(title)) {
        throw new Error("Expense title is required");
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error("Expense amount must be a valid positive number");
    }
    const category = categoryInput.value;
    const date = dateInput.value;
    return {
        title: title,
        amount: amount,
        category: category,
        expenseDate: date,
    };
}

export function getExpenseStats() {
    const expenses = AppState.expenses;
    const totalAmount = expenses.reduce((total, expense) => total + expense.expenseAmount, 0);
    const totalCount = expenses.length;

    const thisMonthAmount = expenses.filter((expense) => {
        if (!expense.expenseDate) return false;
        const expenseDate = parseLocalDate(expense.expenseDate);
        const currentDate = new Date();
        return expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear();
    }).reduce((total, expense) => total + expense.expenseAmount, 0);

    const topCategory = expenses.reduce((topCategory, expense) => {
        const category = expense.expenseCategory;
        if (topCategory[category]) {
            topCategory[category]++;
        } else {
            topCategory[category] = 1;
        }
        return topCategory;
    }, {});

    const categoryExpenses = expenses.reduce((categoryExpenses, expense) => {
        const category = expense.expenseCategory;
        if (categoryExpenses[category]) {
            categoryExpenses[category] += expense.expenseAmount;
        } else {
            categoryExpenses[category] = expense.expenseAmount;
        }
        return categoryExpenses;
    }, {});

    const topCategoryName = Object.keys(topCategory).length > 0 ? Object.keys(topCategory).reduce((a, b) => topCategory[a] > topCategory[b] ? a : b) : "N/A";
    const topCategoryCount = topCategory[topCategoryName];
    const topCategoryPercentage = totalCount > 0 ? ((topCategoryCount / totalCount) * 100).toFixed(2) : 0;
    return {
        totalAmount: totalAmount,
        thisMonthAmount: thisMonthAmount,
        topCategory: topCategoryName || "N/A",
        topCategoryCount: topCategoryCount || 0,
        topCategoryPercentage: topCategoryPercentage || 0,
        totalCount: totalCount,
        categoryBreakdown: categoryExpenses,
    };
}


export function renderExpenseStats() {
    const stats = getExpenseStats();
    const totalAmountEl = document.getElementById("expense-total-amount");
    const thisMonthAmountEl = document.getElementById("expense-this-month");
    const topCategoryEl = document.getElementById("expense-top-category");
    const totalCountEl = document.getElementById("expense-total-count");
    const budgetLimitEl = document.getElementById("expense-budget-limit");
    const budgetProgressEl = document.getElementById("expense-budget-progress-fill");

    if (!totalAmountEl || !thisMonthAmountEl || !topCategoryEl || !totalCountEl) {
        return;
    }
    totalAmountEl.textContent = formatCurrency(stats.totalAmount);
    thisMonthAmountEl.textContent = formatCurrency(stats.thisMonthAmount);
    topCategoryEl.textContent = stats.topCategory;
    totalCountEl.textContent = stats.totalCount;

    const budget = getSettingMonthlyBudget();
    if (budgetLimitEl) budgetLimitEl.textContent = formatCurrency(budget);
    if (budgetProgressEl) {
        const pct = Math.min(100, (stats.thisMonthAmount / budget) * 100);
        budgetProgressEl.style.width = `${pct}%`;
        budgetProgressEl.style.backgroundColor = pct >= 100 ? 'var(--danger)' : 'var(--expense-accent)';
    }
}

export function renderExpenseList(container, filter = "all") {
    if (!container || !(container instanceof HTMLElement)) {
        throw new Error("Valid container element is required");
    }
    let expenses = [...AppState.expenses].sort((a, b) => {
        const dateDiff = parseLocalDate(b.expenseDate) - parseLocalDate(a.expenseDate);
        // Primary sort: by expense date descending
        if (dateDiff !== 0) return dateDiff;
        // Tiebreaker: if same date, sort by creation time descending (newest added = first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    if (filter !== "all") {
        expenses = expenses.filter((expense) => expense.expenseCategory === filter);
    }
    if (expenses.length === 0) {
        container.innerHTML = "<div class='empty-state'><h3>No expenses found</h3><p>Add an expense to get started!</p></div>";
        renderExpenseStats();
        return;
    }
    const expensesHTML = expenses.map((expense) => `
        <article class="expense-card" data-expense-id="${escapeHTML(expense.expenseId)}">
            <h3 class="expense-title">${escapeHTML(expense.expenseTitle)}</h3>
            <p class="expense-amount">${formatCurrency(expense.expenseAmount)}</p>
            <p class="expense-category">${escapeHTML(expense.expenseCategory)}</p>
            <p class="expense-date">${formatDate(expense.expenseDate)}</p>
            <div class="expense-actions">
                <button type="button" class="edit-btn" data-action="edit">Edit</button>
                <button type="button" class="delete-btn" data-action="delete">Delete</button>
            </div>
        </article>
    `).join('');
    container.innerHTML = expensesHTML;
    const breakdownContainer = document.getElementById("category-breakdown-container");
    if (breakdownContainer) renderCategoryBreakdown(breakdownContainer);
    renderExpenseStats();
}

export function handleExpenseListClick(event, container) {
    if (!container || !(container instanceof HTMLElement)) {
        throw new Error("Valid container element is required");
    }
    const action = event.target.dataset.action;
    if (!action) {
        return;
    }
    const expenseCard = event.target.closest("[data-expense-id]");
    if (!expenseCard) return;
    const expenseId = expenseCard.dataset.expenseId;
    try {
        if (action === "delete") {
            deleteExpense(expenseId);
            renderExpenseList(container, currentFilter);
        } else if (action === "edit") {
            startEditingExpense(expenseId);
        }
    } catch (error) {
        alert(`Error performing action on expense: ${error.message}`);
    }
}

export function renderCategoryBreakdown(container) {
    if (!container || !(container instanceof HTMLElement)) {
        return;
    }
    const expenses = AppState.expenses;
    const currentDate = new Date();

    // Filter expenses for this month
    const thisMonthExpenses = expenses.filter((expense) => {
        if (!expense.expenseDate) return false;
        const expenseDate = parseLocalDate(expense.expenseDate);
        return expenseDate.getMonth() === currentDate.getMonth() &&
            expenseDate.getFullYear() === currentDate.getFullYear();
    });

    if (thisMonthExpenses.length === 0) {
        container.innerHTML = "<div class='empty-state'><p>No expenses recorded this month.</p></div>";
        return;
    }

    const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + exp.expenseAmount, 0);

    const breakdown = thisMonthExpenses.reduce((acc, exp) => {
        const cat = exp.expenseCategory || "Other";
        acc[cat] = (acc[cat] || 0) + exp.expenseAmount;
        return acc;
    }, {});

    // Sort categories by amount descending
    const sortedCategories = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    const breakdownHTML = sortedCategories.map(([category, amount]) => {
        const percentage = thisMonthTotal > 0 ? ((amount / thisMonthTotal) * 100).toFixed(1) : 0;
        return `
            <div class="category-breakdown-item">
                <div class="category-info">
                    <span class="category-name"><strong>${escapeHTML(category)}</strong></span>
                    <span class="category-values">${formatCurrency(amount)} (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = breakdownHTML;
}