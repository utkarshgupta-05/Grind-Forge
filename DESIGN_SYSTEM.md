# Design System

This document outlines the UI foundation implemented for the Productivity Dashboard.

## Typography
- **Font Family**: `Inter`, fallback to system-sans.
- **Hierarchy Scale**:
  - Hero Value (`--font-hero`): `clamp(2.2rem, 4vw, 3rem)`
  - Metric/Focus (`--font-metric`): `clamp(1.8rem, 3vw, 2.5rem)`
  - Title/Header: `1rem` to `1.6rem` (Weight 700-800)
  - Body Primary: `0.95rem` (Weight 500)
  - Body Secondary: `0.85rem` to `0.9rem`
  - Small Label (`--font-label`): `0.7rem` (Uppercase, weight 700, letter spacing)

## Colors (Dark Theme)

### Core Surfaces
- **Background (`--main-bg`)**: `#0e1512` - Deep, dark green-tinted charcoal.
- **Sidebar (`--sidebar-bg`)**: `#131a16`
- **Cards (`--card-bg`)**: `#192019`
- **Borders (`--card-border`)**: `#2a3630`
- **Hover/Elevated (`--surface-elevated`)**: `#1f2b23`

### The Module Accent System
Instead of a single brand color, every functional module uses a specific primary accent. This builds a strong identity and makes scanning the UI effortless.
- **Tasks**: Green (`#4e9664`)
- **Focus**: Blue/Slate (`#6b8fb5`)
- **Notes**: Purple/Pink (`#b06bc4`)
- **Expenses**: Copper/Orange (`#c97d45`)
- **Analytics**: Teal/Emerald (`#3ba88c`)

These are complemented by `--[module]-accent-bg` and `--[module]-accent-glow` for soft backgrounds and hover states without muddying the dark mode.

### Semantic/Alert Colors
- **Success**: `#4f9a50`
- **Danger**: `#c96b6b`
- **Warning**: `#d4a84a`

## Elevation & Radii

### Border Radii
- `--radius-sm`: `8px` (Buttons, Inputs, Tags)
- `--radius-md`: `12px` (Standard Cards, Form Wrappers)
- `--radius-lg`: `16px` (Hero/Featured Cards)
- `--radius-xl`: `20px` (Modals/Overlays - currently unused)

### Shadows
- Shadows rely heavily on soft alpha blacks (`0.28` to `0.45` in dark mode) to simulate physical depth.
- Hover states transition to stronger, wider shadows while slightly elevating the Y-axis (`transform: translateY(-1px)`).
- **Hero Shadow (`--shadow-hero`)**: Uses a broad 20px blur to make primary dashboards stand out boldly.

## Layout Principles
1. **Sticky Sidebar**: Brand, navigation, and user context.
2. **Top Header**: Search, theme toggle, and unified notifications.
3. **Responsive Grid**: Flex wrapping for smaller viewports, multi-column grid (`dashboard-split`) for larger screens.
4. **Card Composition**: Clear, bordered cards holding tight padding (`16px-24px`), establishing a reliable visual rhythm without clutter.
