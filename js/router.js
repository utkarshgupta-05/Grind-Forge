// router.js — active nav state, page transitions
export function getCurrentPage() {
    const path = window.location.pathname;
    const parts = path.split("/");
    const page = parts[parts.length - 1];
    if(page === "" ) {
        return "index.html";
    }
    return page;
}

export function highlightActiveLink() {
    const currentPage = getCurrentPage();
    const links = document.querySelectorAll("[data-page]");
    links.forEach((link) => {
        if(link.dataset.page === currentPage) {
            link.classList.add("active");
        }
        else {            
            link.classList.remove("active");
        }
});
}