import { AppState } from "./state.js";
import { initTasksPage } from "./tasks.js";
import { highlightActiveLink } from "./router.js";
import { getCurrentPage } from "./router.js";
import { initHomePage } from "./home.js";


AppState.load();

highlightActiveLink();

const currentPage = getCurrentPage();

if (currentPage === "index.html") {
    initHomePage();
} 
if (currentPage === "tasks.html") {
    initTasksPage();
}