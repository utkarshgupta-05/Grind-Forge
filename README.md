# ⚡ Grind Forge — Productivity Dashboard

A feature-rich, multi-page productivity dashboard built entirely with **Vanilla JavaScript**, **HTML5**, and **CSS3** — no frameworks, no build tools, no dependencies (except Chart.js for analytics visualizations).

Grind Forge helps you manage tasks, track focus sessions, log expenses, take notes, and analyze your productivity trends — all from a single, beautifully designed interface that runs entirely in the browser.

---

## ✨ Features

### 🏠 Home — Command Center
- **Live weather widget** with real-time data from [WeatherAPI](https://www.weatherapi.com/) including high-res condition icons
- **Motivational quote widget** fetched from an external API
- **Quick Stats** — tasks completed today, focus sessions, and lifetime task count
- **Priority Tasks** — top pending tasks pulled from your task list
- **Pomodoro Timer** — start/pause/reset a focus session directly from the home page, synced with the dedicated Focus page
- **Recent Expenses** — latest transactions at a glance
- **Quick Notes** — a scratchpad with real-time autosave (debounced to `localStorage`)
- **SVG doodle background** — hand-crafted productivity-themed illustrations tiled behind the content

### ✅ Tasks
- Create, edit, delete, and complete tasks with **title, description, priority, and deadline**
- **Glassmorphism modal** with slide-in animation for adding/editing tasks
- Priority badges (High / Medium / Low) with color-coded left borders and shadow glows
- Custom round checkboxes with animated strike-through on completion
- Filter and sort capabilities

### 📝 Notes
- Rich-text note editor with **Bold / Italic / Underline** formatting toolbar
- Inline editing via a slide-out detail drawer
- Purple-accented card design with hover glow effects
- Modal compose panel with Escape-key and backdrop-click dismissal
- HTML sanitization to prevent XSS attacks while preserving rich formatting

### 🎯 Focus Timer
- **Circular SVG progress ring** that animates as the countdown progresses
- Configurable duration (15 / 20 / 25 / 30 / 60 min or custom) set from Settings
- **Background persistence** — the timer continues accurately even if you close the tab or navigate away, using timestamp-based calculation in `localStorage`
- Session history log with timestamps
- Fully synced with the Home page Pomodoro widget

### 💰 Expenses
- Log transactions with **description, amount, date, and category**
- Horizontal card rows with transaction icons, pill-shaped category badges, and copper-accent styling
- **Budget tracking** — progress bar and labels dynamically read from Settings
- Budget bar turns red when spending reaches 100%

### 📊 Analytics — Data Visualization Hub
- Powered by **Chart.js** with 6 distinct chart types:
  - **Task Completion Trend** — line chart of daily completed tasks (last 7 days)
  - **Done vs Overdue** — stacked bar chart comparing completions against missed deadlines
  - **Focus Heatmap** — GitHub-style contribution grid (pure HTML/CSS) showing focus intensity over 35 days
  - **Peak Focus Hours** — bar chart mapping focus sessions to 2-hour time blocks
  - **Budget Burn-Down** — area chart contrasting cumulative spending against monthly budget
  - **Spending by Category** — radar chart visualizing expense distribution
- All charts dynamically re-render on **theme toggle** via `MutationObserver`

### 📈 Dashboard
- Aggregated metrics across all modules (tasks, notes, focus, expenses)
- Tab-based filtering (All / Tasks / Notes / Focus / Expenses) with dynamic accent color switching
- **Recent Activity** feed with formatted timestamps and category-specific icon animations
- **Productivity Insights** panel

### ⚙️ Settings
- **Profile** — name, email, and avatar upload (via FileReader → `localStorage`)
- **Appearance** — dark/light theme toggle cards synced with the global theme system
- **Focus Duration** — preset buttons + custom input
- **Monthly Budget** — configurable budget target used by Expenses and Analytics
- **Notifications** — toggle switches for various alert preferences
- **Export Data** — download a full JSON snapshot of all application data

---

## 🎨 Design System

### Theming
- **Dark mode** (default) and **Light mode** with seamless toggling
- CSS custom properties (`--variables`) for all colors, shadows, borders, and accents
- Dynamic logo switching (`logo-dark.png` / `logo-light.png`) on theme change
- Module-specific accent colors: green (tasks), purple (notes), blue (focus), copper (expenses)

### Visual Details
- Glassmorphism overlays with backdrop blur
- Micro-animations on hover, focus, and state transitions
- Shimmer/loading skeleton effects for async data
- SVG doodle background pattern (productivity-themed icons)
- Responsive layout with mobile-optimized views
- Google Fonts (Inter) typography

---

## 🏗️ Architecture

```
productivity-dashboard/
├── index.html              # Home page
├── dashboard.html          # Aggregated dashboard
├── analytics.html          # Chart.js visualizations
├── tasks.html              # Task management
├── notes.html              # Rich-text notes
├── focus.html              # Focus timer with SVG ring
├── expenses.html           # Expense tracker
├── settings.html           # App configuration
│
├── css/
│   ├── base.css            # CSS variables, resets, global styles, doodle background
│   ├── themes.css          # Dark/light theme variable overrides
│   ├── layout.css          # Sidebar, header, content grid structure
│   ├── components.css      # All component styles (cards, modals, buttons, forms)
│   ├── responsive.css      # Mobile/tablet breakpoints
│   └── pages/
│       ├── home.css        # Home-specific widget styles
│       ├── dashboard.css   # Dashboard-specific styles
│       └── analytics.css   # Analytics chart grid styles
│
├── js/
│   ├── app.js              # Entry point — loads state, initializes current page
│   ├── state.js            # Global AppState with localStorage persistence
│   ├── storage.js          # Low-level localStorage read/write helpers
│   ├── router.js           # Page detection and active nav link highlighting
│   ├── config.js           # API keys (gitignored)
│   ├── theme-init.js       # Flash-of-unstyled-content prevention (runs before CSS)
│   ├── theme.js            # Theme toggle logic + dynamic logo switching
│   ├── utils.js            # Shared utilities (escapeHTML, debounce, sanitizeHTML, formatters)
│   ├── home.js             # Home page controller
│   ├── tasks.js            # Tasks CRUD + modal logic
│   ├── notes.js            # Notes CRUD + rich-text editor
│   ├── focus.js            # Focus timer with background persistence
│   ├── expenses.js         # Expenses CRUD + budget tracking
│   ├── dashboard.js        # Dashboard aggregation + tab filtering
│   ├── analytics.js        # Chart.js rendering + theme-aware re-rendering
│   └── settings.js         # Settings forms + profile/avatar management
│
└── assets/
    ├── fonts/              # Local font files
    ├── icons/              # UI icons
    └── images/             # Logo variants and other images
```

### Key Technical Decisions
- **ES6 Modules** — all JS files use `import`/`export` for clean dependency management
- **O(1) Page Routing** — `app.js` uses a hash map (`pageInitMap`) instead of if/else chains
- **Centralized State** — `AppState` acts as the single source of truth, persisted to `localStorage`
- **No Build Step** — runs directly in the browser via native ES module support

---

## 🔒 Security

- **XSS Prevention** — user inputs are escaped with `escapeHTML()` before rendering
- **Rich-Text Sanitization** — notes content is sanitized via a native `DOMParser`-based sanitizer that strips `<script>`, `<iframe>`, and `on*` event handlers
- **API Key Isolation** — Weather API key is stored in `js/config.js` which is gitignored
- **Timezone Safety** — date parsing uses `parseLocalDate()` to prevent timezone-shifting bugs

---

## ⚡ Performance

- **Debounced Autosave** — Quick Notes input is wrapped in a `debounce()` function to limit `localStorage` writes
- **Timestamp-Based Timer** — Focus timer stores start timestamps instead of counting intervals, ensuring accurate resume after page navigation or tab closure
- **No Framework Overhead** — zero runtime dependencies for the core app (Chart.js is loaded only on the Analytics page)

---

## 🚀 Getting Started

### Prerequisites
- A modern browser (Chrome, Firefox, Edge, Safari)
- A local development server (e.g., VS Code Live Server extension)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/utkarshgupta-05/Grind-Forge.git
   cd Grind-Forge
   ```

2. **Add your Weather API key**
   
   Create `js/config.js` (this file is gitignored):
   ```javascript
   export const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';
   ```
   Get a free key at [weatherapi.com](https://www.weatherapi.com/).

3. **Start a local server**
   
   Using VS Code: Install the **Live Server** extension and click "Go Live".
   
   Or use any static file server:
   ```bash
   npx serve .
   ```

4. **Open in browser**
   
   Navigate to `http://localhost:5500` (or whichever port your server uses).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (semantic elements) |
| Styling | Vanilla CSS3 (custom properties, flexbox, grid) |
| Logic | Vanilla JavaScript (ES6+ modules) |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Weather | [WeatherAPI](https://www.weatherapi.com/) |
| Storage | Browser `localStorage` |
| Fonts | [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ☕ and pure JavaScript — no frameworks needed.
</p>
