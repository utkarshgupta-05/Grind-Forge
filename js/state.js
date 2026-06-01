// state.js — shared in-memory state
import { storageGet, storageSet } from "./storage.js";

export const AppState = {
  tasks: [],
  notes: [],
  focusSessions: [],
  expenses: [],
  settings: {},

  load() {
    this.tasks = storageGet("app_tasks") || [];
    this.notes = storageGet("app_notes") || [];
    this.focusSessions = storageGet("app_focus_sessions") || [];
    this.expenses = storageGet("app_expenses") || [];
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

