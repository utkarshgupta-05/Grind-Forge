// utils.js — helpers: date formatting, id generation, XSS escaping

import { AppState } from "./state.js";
import { storageGet } from "./storage.js";

/**
 * Escape user-supplied strings before inserting into innerHTML.
 * Must be used everywhere user content is rendered into HTML templates.
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function generateId() {
    const randNum = Math.random();
    const hex = randNum.toString(16);
    const id = hex.replace('0.','');
    const shortId = id.slice(0,8);
    return shortId;
}

export function formatDate(date) {
    if (date === undefined || date === null) {
        return 'Invalid date';
    }
    // Guard: only call .trim() if it's actually a string
    if (typeof date === 'string') {
        const trimDate = date.trim();
        if (trimDate === '') {
            return 'Invalid date';
        }
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return 'Invalid date';
    }
    const formattedDate = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    return formattedDate;
}

export function formatCurrency(amount) {
     if(amount === undefined || amount === null) {
        return 'Invalid amount';
    }
    if(typeof amount === 'string') {
        const trimAmount = amount.trim();
        if(trimAmount === '') {
            return 'Invalid amount';
        }
        amount = parseFloat(trimAmount);
    }
    if(isNaN(amount)) {
        return 'Invalid amount';
    }
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

export function getDaysDiff(targetDate,currentDate) {
    if(targetDate === undefined || targetDate === null) {
        return null;
    }
    if(currentDate === undefined || currentDate === null) {
        return null;
    }
    const target = new Date(targetDate);
    const current = new Date(currentDate);
    if(isNaN(target.getTime()) || isNaN(current.getTime())) {
        return null;
    }
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export function validateRequired(value) {
    if(value === undefined || value === null) {
        return false;
    }
    const val = value.trim();
    if(val === '') {
        return false;
    }
    return true;
}

export function debounce(fn,delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

export function startLiveTimer() {
    const updateTimer = () => {
        const now = new Date();
        
        // Format time as HH:MM:SS
        const timeString = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Format date as DD/MM/YYYY
        const dateString = now.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const currentTimeEl = document.getElementById('current-time');
        const currentDateEl = document.getElementById('current-date');
        
        if (currentTimeEl) {
            currentTimeEl.textContent = timeString;
        }
        if (currentDateEl) {
            currentDateEl.textContent = dateString;
        }
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    setInterval(updateTimer, 1000);
}

export function updateHeaderAvatar() {
    const avatarEls = document.querySelectorAll('.profile-avatar');
    if (avatarEls.length === 0) return;

    const savedAvatar = storageGet("settings_avatar_dataurl");
    const profile = AppState.settings?.profile || {};
    
    avatarEls.forEach(avatarEl => {
        if (savedAvatar) {
            avatarEl.innerHTML = `<img src="${savedAvatar}" alt="Avatar" />`;
        } else {
            const initials = (profile.name || "U").charAt(0).toUpperCase();
            avatarEl.textContent = initials;
        }
    });
}