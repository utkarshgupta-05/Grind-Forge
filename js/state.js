// state.js — shared in-memory state
import { storageGet, storageSet } from "./storage.js";

export const AppState = {
  tasks: [],
  notes: [],
  focusSessions: [],
  expenses: [],
  settings: {},

  load() {
    const safeArray = (val) => Array.isArray(val) ? val : [];
    this.tasks = safeArray(storageGet("app_tasks"));
    this.notes = safeArray(storageGet("app_notes"));
    this.focusSessions = safeArray(storageGet("app_focus_sessions"));
    this.expenses = safeArray(storageGet("app_expenses"));
    this.settings = storageGet("app_settings") || {};
  },

  save() {
    storageSet("app_tasks", this.tasks);
    storageSet("app_notes", this.notes);
    storageSet("app_focus_sessions", this.focusSessions);
    storageSet("app_expenses", this.expenses);
    storageSet("app_settings", this.settings);
  },
};

