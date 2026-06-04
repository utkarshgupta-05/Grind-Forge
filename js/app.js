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
import { startLiveTimer } from "./utils.js";


AppState.load();

initTheme();
bindThemeToggle();
highlightActiveLink();
startLiveTimer();

const currentPage = getCurrentPage();
document.body.dataset.page = currentPage;

if (currentPage === "index.html") {
    initHomePage();
} 
if (currentPage === "tasks.html") {
    initTasksPage();
}
if (currentPage === "dashboard.html") {
    initDashboardPage();
}
if (currentPage === "focus.html") {
    initFocusPage();
}
if (currentPage === "notes.html") {
    initNotesPage();
}
if (currentPage === "expenses.html") {
    initExpensesPage();
}