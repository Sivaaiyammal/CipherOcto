---
name: CipherOcto Design System
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#45464d'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#1b6b51'
  on-secondary: '#ffffff'
  secondary-container: '#a6f2d1'
  on-secondary-container: '#237157'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001453'
  on-tertiary-container: '#607cec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#a6f2d1'
  secondary-fixed-dim: '#8bd6b6'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513b'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001453'
  on-tertiary-fixed-variant: '#173bab'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  kpi-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an editorial, high-utility SaaS environment for business and app intelligence dashboards. It merges the structural precision of modern financial tools with the approachability of editorial pastels, completely avoiding stale enterprise grayness while refusing the visual distraction of heavy glassmorphism or hyper-saturated neons.

The design philosophy balances three foundational pillars:
- **Playful Rigor:** Dense, mission-critical metrics and multi-tenant telemetry presented within soothing, distinct pastel containers that aid visual scanning and cognitive segmentation.
- **Architectural Anchoring:** Deep slate and obsidian framing for high-level shell chrome (sidebar navigation, critical master controls) juxtaposed against an inviting, warm off-white canvas.
- **Micro-Precision Utility:** Crisp 1px color-harmonized borders, generous tap targets, restrained ambient elevation, and robust typographic scannability optimized for high-volume operational decisions.

## Colors

The palette leverages high-contrast deep slate anchors, a warm editorial background canvas, and five designated pastel domain themes designed with strict WCAG AA+ compliance between backgrounds, borders, and foreground text.

### Foundations & Canvas
- **Deep Navy Base (`#0F172A` / `#1E293B`):** Reserved for global primary actions, high-emphasis interactive states, and the core navigation shell.
- **Workspace Canvas (`#FAF8F5`):** Warm off-white background setting an editorial tone that reduces eye fatigue over prolonged data sessions.
- **Surface Pure (`#FFFFFF`):** Base background for dense analytical tables, active modal surfaces, and primary input fields.

### Pastel Semantic Tiles & Indicators
Each accent suite operates with a 3-tier structure: background surface, matching 1px border stroke, and deep accessible text/iconography.
- **Mint Suite (Revenue, ARR, Profit Margins):**
  - Surface: `#ECFDF5` (Hover: `#D1FAE5`)
  - Border: `#A7F3D0`
  - Text & Accents: `#065F46`
- **Blue Suite (Subscriptions, Active Users, MRR):**
  - Surface: `#EFF6FF` (Hover: `#DBEAFE`)
  - Border: `#BFDBFE`
  - Text & Accents: `#1E40AF`
- **Pink Suite (App Installs, Virality, Churn Risk):**
  - Surface: `#FDF2F8` (Hover: `#FCE7F3`)
  - Border: `#FBCFE8`
  - Text & Accents: `#9D174D`
- **Amber / Peach Suite (Expenses, Thresholds, Pending Flags):**
  - Surface: `#FEFCE8` (Hover: `#FEF08A`)
  - Border: `#FDE047`
  - Text & Accents: `#854D0E`
- **Lavender Suite (Platform Telemetry, Infrastructure, Integrations):**
  - Surface: `#F5F3FF` (Hover: `#EDE9FE`)
  - Border: `#DDD6FE`
  - Text & Accents: `#5B21B6`

### Text & Neutrals
- **Headings & High-Emphasis Data:** `#0F172A` (Slate 900)
- **Body & Secondary Copy:** `#475569` (Slate 600)
- **Captions, Column Headers, Empty States:** `#94A3B8` (Slate 400)
- **Dividers & Structural Borders:** `#E2E8F0` (Slate 200)

## Typography

Typography relies entirely on **Plus Jakarta Sans** for its geometric balance, friendly terminals, and high legibility at dense dashboard scales.

- **Tabular Numerals (`tnum` / `font-variant-numeric: tabular-nums`):** Mandatory for all data tables, KPI metrics, chart tooltips, and timecode readouts to ensure numbers stay vertically aligned.
- **Hierarchy Rules:** 
  - Section banners and KPI figures lean on bold weights (`700`) with subtle negative letter spacing (`-0.02em`) to maintain tightness.
  - Column headers and interactive pill tabs use all-caps or title-case `label-sm` with widened tracking (`0.04em`) and medium/semibold weights to anchor dense table structures without competing with row data.
  - Interactive controls never fall below `13px` (`label-md` or `body-sm`) to guarantee operational clarity.

## Layout & Spacing

The layout is built on a responsive 12-column fluid grid system, anchored by a persistent desktop navigation rail (width: `260px` expanded, `72px` collapsed).

### Breakpoints & Adaptive Behavior
- **Mobile (< 768px):** 4-column layout, `margin-mobile` (16px), 12px gutters. The global navigation rail converts into a bottom bar or off-canvas drawer. KPI tiles stack into 1-column cards.
- **Tablet (768px - 1024px):** 8-column layout, `margin` (24px), 16px gutters. KPI grids reflow into a 2x2 matrix. Complex data grids gain horizontal smooth-scroll containers with frozen primary entity columns.
- **Desktop (1025px+):** 12-column layout, `margin-desktop` (32px), `gutter-lg` (24px). Analytical KPI cards render in 4-column or 5-column fluid ribbons.

### Layout Rhythm
- Dashboard views must maintain an 8px base grid rhythm (`0.5rem`, `1rem`, `1.5rem`, `2rem`).
- Tile internal padding uniformly follows `space-lg` (`1.5rem` / 24px) for prominent stat cards and `space-md` (`1rem` / 16px) for compact utility widgets and toolbars.

## Elevation & Depth

Visual separation relies on crisp border definition and subtle ambient shadows rather than heavy blurs or excessive skeuomorphic depth.

### Elevation Hierarchy
- **Level 0 (Base Canvas):** `#FAF8F5`. Flat, unbordered surface hosting structural cards.
- **Level 1 (Card & Container Surface):** Pure white `#FFFFFF` or semantic pastel containers. Always defined with a matching 1px solid perimeter border (`border: 1px solid var(--border-color)`). Elevation shadow is whisper-soft:
  - `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)`.
- **Level 2 (Interactive Hover & Popovers):** Triggered on hovering over interactive KPI tiles, active table rows, or dropdown selectors:
  - `transform: translateY(-1px)`
  - `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Slide-over Drawers & Toasts):**
  - Backdrop: `rgba(15, 23, 42, 0.4)` with an ultra-light `2px` blur.
  - `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.

## Shapes

The geometric signature uses a rounded profile with dedicated scales for cards, interactive widgets, and status pills.

### Geometry Standards
- **Primary Dashboard Cards & Stat Tiles:** `18px` (`1.125rem` / `rounded-2xl`). This deliberate curve softens the analytical density and emphasizes the friendly editorial nature of the interface.
- **Modal Containers & Large Panels:** `20px` (`1.25rem`).
- **Interactive Controls (Inputs, Standard Buttons, Selectors):** `10px` (`0.625rem`). Balances visual comfort with click-target density.
- **Pill Badges, Tab Toggles, and Trend Chips:** Fully rounded pill geometry (`9999px` / `rounded-full`).

## Components

### 1. KPI Stat Tiles
- Built with `18px` radius, 1px matching pastel border, and respective pastel tint fill.
- Internal hierarchy:
  - Top row: Domain title in matching dark pastel tone (`label-md`) paired with a 32px circular icon badge (20% opacity matching fill).
  - Center: Large tabular metric (`kpi-metric`) in `#0F172A`.
  - Bottom: Pill badge with upward/downward delta trend indicator (`+14.2%`) paired with micro caption (`vs. last 30 days`).

### 2. Buttons
- **Primary:** Dark Navy (`#0F172A`) fill, crisp `#FFFFFF` text, `10px` radius, subtle top-highlight border (`rgba(255, 255, 255, 0.1)`). Hover state transitions to `#1E293B`.
- **Secondary / Pastel Action:** Tinted pastel background (e.g., `#EFF6FF`), matching tone border (`#BFDBFE`), and deep brand text (`#1E40AF`).
- **Outline / Neutral:** Pure white fill, `#E2E8F0` border, `#0F172A` text. Hover to `#FAF8F5`.
- **Sizes:** Small (`32px` height, `12px` font), Medium (`40px` height, `14px` font), Large (`48px` height, `16px` font).

### 3. Data Tables
- Encased within an `18px` bordered white container.
- **Header Row:** Crisp background (`#FAF8F5`), bottom 1px border (`#E2E8F0`), labels set in `11px` bold uppercase (`#94A3B8`).
- **Data Rows:** `56px` height, hover state highlighting in ultra-light slate or pastel tint (`#F8FAFC`).
- **Cells:** Pure tabular numbers (`tnum`) for monetary and quantitative metrics; right-aligned for values, left-aligned for identity/entity columns.

### 4. Pill Badges & Trend Indicators
- Height: `24px`. Full radius (`9999px`).
- Padding: `0.25rem 0.625rem`.
- Font: `11px` bold (`Plus Jakarta Sans`).
- Color mappings: Uses the exact paired pastel surface + border + text (e.g., Mint Badge = `#ECFDF5` background, `#A7F3D0` border, `#065F46` text).

### 5. Input Fields & Form Controls
- Height: `40px` (`10px` border-radius).
- Background: `#FFFFFF`. Border: 1px solid `#E2E8F0`.
- Focus State: 1px solid `#0F172A` with a distinct `3px` focus ring in `rgba(15, 23, 42, 0.08)`.
- Placeholder Text: `#94A3B8`. Active Text: `#0F172A`.

### 6. Interactive Segmented Tabs
- Container: Enclosed pill housing in `#F1F5F9` with `6px` internal padding.
- Tab Item: Transitioning white pill with subtle elevation (`0 1px 3px rgba(0,0,0,0.06)`) when active; transparent with `#475569` text when inactive.