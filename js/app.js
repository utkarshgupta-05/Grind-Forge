import { AppState } from "./state.js";
import { highlightActiveLink } from "./router.js";
import { getCurrentPage } from "./router.js";
import { initTasksPage } from "./tasks.js";
import { initHomePage } from "./home.js";
import { initDashboardPage } from "./dashboard.js";
import { initFocusPage } from "./focus.js";
import { initNotesPage } from "./notes.js";

AppState.load();

highlightActiveLink();

const currentPage = getCurrentPage();

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