(function () {
  try {
    if (localStorage.getItem("productivity-theme") === "light") {
      document.documentElement.classList.add("light-theme");
      document.documentElement.dataset.theme = "light";
    } else {
      document.documentElement.dataset.theme = "dark";
    }
  } catch (_) {
    /* localStorage unavailable */
  }
})();
