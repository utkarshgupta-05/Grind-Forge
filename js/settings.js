// settings.js — Settings page logic
import { AppState } from "./state.js";
import { storageGet, storageSet } from "./storage.js";
import { applyTheme, getStoredTheme } from "./theme.js";
import { updateHeaderProfile } from "./utils.js";

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────

/** Read the focus duration preference (in minutes, default 25) */
export function getSettingFocusDuration() {
    return AppState.settings?.focusDurationMinutes || 25;
}

/** Read the monthly budget preference (default 500) */
export function getSettingMonthlyBudget() {
    return AppState.settings?.monthlyBudget || 500;
}

/** Persist a single key into AppState.settings */
function saveSetting(key, value) {
    if (!AppState.settings) AppState.settings = {};
    AppState.settings[key] = value;
    AppState.save();
}

// ─────────────────────────────────────────
//  PROFILE SECTION
// ─────────────────────────────────────────

function initProfileSection() {
    const nameInput = document.getElementById("settings-name");
    const emailInput = document.getElementById("settings-email");
    const avatarEl = document.getElementById("settings-avatar-display");
    const uploadBtn = document.getElementById("settings-upload-btn");
    const avatarFileInput = document.getElementById("settings-avatar-file");
    const saveBtn = document.getElementById("settings-profile-save-btn");
    const feedback = document.getElementById("settings-profile-feedback");

    if (!nameInput || !emailInput) return;

    // Load saved profile
    const profile = AppState.settings?.profile || {};
    nameInput.value = profile.name || "";
    emailInput.value = profile.email || "";

    // Load saved avatar
    const savedAvatar = storageGet("settings_avatar_dataurl");
    if (savedAvatar && avatarEl) {
        avatarEl.innerHTML = `<img src="${savedAvatar}" alt="Avatar" />`;
    } else if (avatarEl) {
        const initials = (profile.name || "U").charAt(0).toUpperCase();
        avatarEl.textContent = initials;
    }

    // Avatar upload
    if (uploadBtn && avatarFileInput) {
        uploadBtn.addEventListener("click", () => avatarFileInput.click());
        avatarFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 800 * 1024) {
                alert("Image too large. Max size is 800KB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                storageSet("settings_avatar_dataurl", dataUrl);
                if (avatarEl) {
                    avatarEl.innerHTML = `<img src="${dataUrl}" alt="Avatar" />`;
                }
                updateHeaderProfile();
            };
            reader.readAsDataURL(file);
        });
    }

    // Save profile
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            saveSetting("profile", {
                name: nameInput.value.trim(),
                email: emailInput.value.trim()
            });
            // Update avatar initials if no image
            const avatarImg = avatarEl?.querySelector("img");
            if (!avatarImg && avatarEl) {
                avatarEl.textContent = (nameInput.value.trim() || "U").charAt(0).toUpperCase();
            }
            updateHeaderProfile();
            showFeedback(feedback, "Profile saved!");
        });
    }
}

// ─────────────────────────────────────────
//  APPEARANCE SECTION
// ─────────────────────────────────────────

function initAppearanceSection() {
    const darkCard = document.getElementById("settings-theme-dark");
    const lightCard = document.getElementById("settings-theme-light");
    const darkRadio = document.getElementById("settings-theme-dark-radio");
    const lightRadio = document.getElementById("settings-theme-light-radio");

    if (!darkCard || !lightCard) return;

    function updateThemeUI(theme) {
        const isDark = theme === "dark";
        darkCard.classList.toggle("active", isDark);
        lightCard.classList.toggle("active", !isDark);
        if (darkRadio) darkRadio.classList.toggle("checked", isDark);
        if (lightRadio) lightRadio.classList.toggle("checked", !isDark);
    }

    // Init from stored theme
    updateThemeUI(getStoredTheme());

    darkCard.addEventListener("click", () => {
        applyTheme("dark");
        updateThemeUI("dark");
    });

    lightCard.addEventListener("click", () => {
        applyTheme("light");
        updateThemeUI("light");
    });
}

// ─────────────────────────────────────────
//  FOCUS DURATION SECTION
// ─────────────────────────────────────────

function initFocusDurationSection() {
    const container = document.getElementById("settings-focus-duration-options");
    const customInput = document.getElementById("settings-focus-custom-input");
    const saveBtn = document.getElementById("settings-focus-save-btn");
    const feedback = document.getElementById("settings-focus-feedback");

    if (!container) return;

    const PRESET_DURATIONS = [15, 20, 25, 30, 60];
    let selectedMinutes = getSettingFocusDuration();

    // Render preset buttons
    container.innerHTML = PRESET_DURATIONS.map(min => `
        <button type="button" class="focus-duration-btn${selectedMinutes === min ? ' active' : ''}"
                data-minutes="${min}" id="focus-btn-${min}">
            ${min === 60 ? '1 hr' : `${min} min`}
        </button>
    `).join('');

    // Custom btn
    const isCustom = !PRESET_DURATIONS.includes(selectedMinutes);
    const customBtn = document.createElement("button");
    customBtn.type = "button";
    customBtn.className = `focus-duration-btn${isCustom ? ' active' : ''}`;
    customBtn.id = "focus-btn-custom";
    customBtn.textContent = "Custom";
    container.appendChild(customBtn);

    // Set custom input value if custom
    if (customInput) {
        customInput.value = isCustom ? selectedMinutes : "";
        customInput.parentElement.style.display = isCustom ? "flex" : "none";
    }

    function setActive(minutes) {
        selectedMinutes = minutes;
        container.querySelectorAll(".focus-duration-btn").forEach(btn => {
            btn.classList.remove("active");
        });
    }

    // Preset click
    container.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-minutes]");
        if (btn) {
            setActive(parseInt(btn.dataset.minutes, 10));
            btn.classList.add("active");
            if (customInput) customInput.parentElement.style.display = "none";
        } else if (e.target === customBtn) {
            setActive(null);
            customBtn.classList.add("active");
            if (customInput) customInput.parentElement.style.display = "flex";
        }
    });

    // Custom input change
    if (customInput) {
        customInput.addEventListener("input", () => {
            const val = parseInt(customInput.value, 10);
            if (!isNaN(val) && val > 0) {
                selectedMinutes = val;
            }
        });
    }

    // Save
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const finalMinutes = selectedMinutes || parseInt(customInput?.value, 10);
            if (!finalMinutes || isNaN(finalMinutes) || finalMinutes < 1) {
                showFeedback(feedback, "Please select or enter a valid duration.", true);
                return;
            }
            saveSetting("focusDurationMinutes", finalMinutes);
            // Also reset the persistent timer state so new sessions use the new duration
            storageSet("app_focus_timer_state", null);
            showFeedback(feedback, `Focus duration set to ${finalMinutes} min. Next session will use this.`);
        });
    }
}

// ─────────────────────────────────────────
//  BUDGET SECTION
// ─────────────────────────────────────────

function initBudgetSection() {
    const budgetInput = document.getElementById("settings-budget-input");
    const saveBtn = document.getElementById("settings-budget-save-btn");
    const feedback = document.getElementById("settings-budget-feedback");

    if (!budgetInput) return;

    budgetInput.value = getSettingMonthlyBudget();

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const val = parseFloat(budgetInput.value);
            if (isNaN(val) || val <= 0) {
                showFeedback(feedback, "Please enter a valid budget amount.", true);
                return;
            }
            saveSetting("monthlyBudget", val);
            showFeedback(feedback, `Monthly budget set to $${val.toFixed(2)}.`);
        });
    }
}

// ─────────────────────────────────────────
//  NOTIFICATIONS SECTION
// ─────────────────────────────────────────

function initNotificationsSection() {
    const toggleIds = [
        { id: "notif-daily-digest", key: "notifDailyDigest" },
        { id: "notif-payment-alerts", key: "notifPaymentAlerts" },
        { id: "notif-focus-prompts", key: "notifFocusPrompts" }
    ];

    toggleIds.forEach(({ id, key }) => {
        const toggle = document.getElementById(id);
        if (!toggle) return;
        // Load saved value (default to true for daily digest and payment alerts)
        const defaults = { notifDailyDigest: true, notifPaymentAlerts: true, notifFocusPrompts: false };
        const saved = AppState.settings?.[key];
        toggle.checked = saved !== undefined ? saved : defaults[key];
        toggle.addEventListener("change", () => {
            saveSetting(key, toggle.checked);
        });
    });
}

// ─────────────────────────────────────────
//  EXPORT SECTION
// ─────────────────────────────────────────

function initExportSection() {
    const exportBtn = document.getElementById("settings-export-btn");
    if (!exportBtn) return;

    exportBtn.addEventListener("click", exportAccountData);
}

function exportAccountData() {
    const data = {
        exportedAt: new Date().toISOString(),
        tasks: AppState.tasks || [],
        notes: AppState.notes || [],
        focusSessions: AppState.focusSessions || [],
        expenses: AppState.expenses || [],
        settings: AppState.settings || {}
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grind-forge-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────
//  SHARED UTILITY
// ─────────────────────────────────────────

function showFeedback(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "var(--danger)" : "var(--success)";
    el.style.opacity = "1";
    setTimeout(() => { el.style.opacity = "0"; }, 3000);
}

// ─────────────────────────────────────────
//  MAIN INIT
// ─────────────────────────────────────────

export function initSettingsPage() {
    initProfileSection();
    initAppearanceSection();
    initFocusDurationSection();
    initBudgetSection();
    initNotificationsSection();
    initExportSection();
}
