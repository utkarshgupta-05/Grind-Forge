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

export function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '0';
    }
    return String(value);
}

export function formatMinutes(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '0 min';
    }
    return `${value} min`;
}

export function getDaysDiff(targetDate,currentDate) {
    if(targetDate === undefined || targetDate === null) {
        return null;
    }
    if(currentDate === undefined || currentDate === null) {
        return null;
    }
    const target = parseLocalDate(targetDate);
    const current = parseLocalDate(currentDate);
    if(isNaN(target.getTime()) || isNaN(current.getTime())) {
        return null;
    }
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

export function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const datePart = dateStr.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
    }
    return new Date(dateStr);
}

export function sanitizeHTML(html) {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'meta', 'base', 'link'];
    dangerousTags.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });
    
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
        const attributes = Array.from(el.attributes);
        attributes.forEach(attr => {
            if (attr.name.toLowerCase().startsWith('on')) {
                el.removeAttribute(attr.name);
            }
            if ((attr.name.toLowerCase() === 'href' || attr.name.toLowerCase() === 'src') && 
                attr.value.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    return doc.body.innerHTML;
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

export function updateHeaderProfile() {
    const avatarEls = document.querySelectorAll('.profile-avatar');
    const welcomeEls = document.querySelectorAll('.welcome-text');

    const savedAvatar = storageGet("settings_avatar_dataurl");
    const profile = AppState.settings?.profile || {};
    const userName = profile.name || "User";
    
    if (avatarEls.length > 0) {
        avatarEls.forEach(avatarEl => {
            if (savedAvatar) {
                avatarEl.innerHTML = `<img src="${savedAvatar}" alt="Avatar" />`;
            } else {
                const initials = userName.charAt(0).toUpperCase();
                avatarEl.textContent = initials;
            }
        });
    }

    if (welcomeEls.length > 0) {
        welcomeEls.forEach(welcomeEl => {
            // Only update if it originally contained "Welcome" to avoid overwriting specific page titles if they differ
            if (welcomeEl.textContent.includes("Welcome") || welcomeEl.textContent === "Settings") {
                welcomeEl.textContent = `Welcome, ${escapeHTML(userName)}!`;
            }
        });
    }
}