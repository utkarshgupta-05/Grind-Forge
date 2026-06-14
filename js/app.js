import { initAnalyticsPage } from "./analytics.js";
import { AppState } from "./state.js";
import { highlightActiveLink } from "./router.js";
import { getCurrentPage } from "./router.js";
import { initTheme, bindThemeToggle } from "./theme.js";
import { initTasksPage } from "./tasks.js";
import { initHomePage } from "./home.js";
import { initDashboardPage } from "./dashboard.js";
import { initFocusPage } from "./focus.js";
import { initNotesPage } from "./notes.js";
import { initExpensesPage } from "./expenses.js";
import { initSettingsPage } from "./settings.js";
import { startLiveTimer, updateHeaderProfile } from "./utils.js";


AppState.load();

initTheme();
bindThemeToggle();
highlightActiveLink();
startLiveTimer();
updateHeaderProfile();

const currentPage = getCurrentPage();
document.body.dataset.page = currentPage;

const pageInitMap = {
  "analytics.html": initAnalyticsPage,
    "index.html": initHomePage,
    "tasks.html": initTasksPage,
    "notes.html": initNotesPage,
    "focus.html": initFocusPage,
    "expenses.html": initExpensesPage,
    "settings.html": initSettingsPage,
    "dashboard.html": initDashboardPage
};

const initFunction = pageInitMap[currentPage];
if (initFunction) {
    initFunction();
}