// storage.js — safe localStorage wrappers
export function storageSet(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
        return true;
    }
    catch(error) {
        console.error(`[storageSet] Error saving ${key}:`, error);
        return false;
    }
}


export function storageGet(key) {
    try {
        const data = localStorage.getItem(key);

        if (data === null) {
            return null;
        }
        return JSON.parse(data);
    }
    catch(error) {
        console.error(`[storageGet] Error reading ${key}:`, error);
        return null;
    }
}


export function storageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    }
    catch(error) {
        console.error(`[storageRemove] Error removing ${key}:`, error);
        return false;
    }
}