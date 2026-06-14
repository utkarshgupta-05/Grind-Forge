const THEME_KEY = "productivity-theme";
const LIGHT_CLASS = "light-theme";

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function updateToggleUi(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const isLight = theme === "light";
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.setAttribute("aria-pressed", String(isLight));

  const icon = btn.querySelector(".theme-toggle-icon");
  const text = btn.querySelector(".theme-toggle-label");
  if (icon) icon.textContent = isLight ? "\u{1F319}" : "\u{2600}\u{FE0F}";
  if (text) text.textContent = isLight ? "Dark" : "Light";
}

export function applyTheme(theme) {
  const isLight = theme === "light";
  document.documentElement.classList.toggle(LIGHT_CLASS, isLight);
  document.documentElement.dataset.theme = theme;

  // Update logo images dynamically based on theme
  const logoImages = document.querySelectorAll(".logo-icon");
  logoImages.forEach((img) => {
    img.src = isLight ? "assets/images/logo-light.png" : "assets/images/logo-dark.png";
  });

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {
    alert("Error: Local storage not available, theme will not persist.")
  }

  updateToggleUi(theme);
}

export function initTheme() {
  applyTheme(getStoredTheme());
}

export function toggleTheme() {
  applyTheme(getStoredTheme() === "light" ? "dark" : "light");
}

export function bindThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn || btn.dataset.bound === "true") return;
  btn.dataset.bound = "true";
  btn.addEventListener("click", toggleTheme);
}
