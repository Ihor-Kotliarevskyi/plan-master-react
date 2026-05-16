# Architecture

## Overview

Plan Master is a static modular SPA:

- shell: `index.html`
- styles: `css/*.css`
- behavior: `js/*.js`
- storage: `localStorage`
- primary backend: Supabase via `js/supabase-api.js`

There is no bundler, framework, or server-rendered layer in this repository. The runtime is assembled directly by script tags in `index.html`.

## Runtime Composition

### Main panes

The app has four top-level panes:

- `pane-gantt`
- `pane-finance`
- `pane-contractors`
- `pane-charts`

`js/app.js` switches panes, restores the last active tab from `localStorage`, and triggers pane-specific rerendering.

### Modal and overlay layer

Current overlays in `index.html` include:

- task editor
- project settings
- project manager
- category editor
- dependency list
- notes
- print dialog
- user cabinet

Most modal logic lives in:

- `js/modal.js`
- `js/user.js`
- `js/print.js`
- `js/contractors.js`

## Source Modules

### Core state and lifecycle

- `js/state.js`: in-memory global state
- `js/storage.js`: local persistence, migration, project switching
- `js/app.js`: tab switching, search, export/import, overdue banner, startup

### Gantt

- `js/render.js`: gantt table, toolbar, grouping, gantt-side filters
- `js/drag.js`: drag/resize interactions for bars
- `js/critical.js`: critical path calculation
- `js/dep-arrows.js`: SVG dependency arrows and chain highlighting
- `js/baseline.js`: baseline snapshot and rendering helpers

### Task editing

- `js/modal.js`: task modal, phases, dependency editor, notes, project manager, demo project
- `js/costs.js`: task cost items, payments, totals inside the task modal

### Finance and contractors

- `js/finance.js`: EVM, S-curve, weekly cost chart, table mode, finance filters
- `js/contractors.js`: contractor aggregation, imports, payment registers, contractor modals
- `js/charts.js`: charts pane and custom/auto charts

### User and access

- `js/user.js`: user profile, theme, avatar, auth UI, baseline controls
- `js/guard.js`: readonly-related protection helpers

### Backend adapters

- `js/supabase-api.js`: active backend
- `js/api.js`: reserve Express/Mongo adapter

### Export and utilities

- `js/print.js`: print preview, print layout, PDF export
- `js/utils.js`: shared helpers
- `js/constants.js`: defaults and constants

## Global State

The effective state model is broader than just project data.

### Project state

```js
let allProjects = {};
let currentId = "";
let tasks = [], proj = {}, cats = [];
let nextN = 43;
```

Each project snapshot in `allProjects` can also contain:

- `_localVersion`
- `_serverVersion`
- `_serverId`
- `_role`

### View state

```js
let hiddenCats = new Set();
let filterCat = null;
let groupBy = "none";
let collapsedGrps = new Set();
let taskSearch = "";
let ganttFilters = { contractor: [], pay: [] };
let zoomLevel = 25;
let monoBarColor = null;
```

### Finance and charts state

```js
let finSort = { col: "n", dir: 1 };
let finFilters = { q: "", cat: [], stat: [], contr: [], budgetMin: "", budgetMax: "", onlyBudget: false };
let showEVM = true;
let finActiveTab = "overview";
let showWeeklyCostBars = false;
let financeChartHeight = 260;
let chartInstances = [];
let customCharts = [];
```

## Persistence and Sync

### Local-first buffer

`js/storage.js` uses:

- `SK_BUF = "gantt_buf"`
- `UI_SK = "gantt_pro_ui"`

`saveAll()`:

1. snapshots `proj`, `cats`, `tasks`, `nextN` into `allProjects[currentId]`
2. increments `_localVersion`
3. writes the buffer to `localStorage`
4. if logged in, schedules `apiSyncProject()` with an `800ms` debounce

### Project migration

`loadCurrent()` calls `_migrateProject()` to normalize older data:

- ensures task UUIDs exist
- rewrites legacy dependency references to `{ id, type, threshold }`
- migrates baseline task references to UUID-based ids

### Supabase sync model

`js/supabase-api.js` is the source of truth for cloud sync:

- reads auth session from Supabase
- loads project list from `projects` and `project_shares`
- writes metadata to `projects`
- writes tasks through RPC `upsert_tasks`
- stores sharing role in `_role`
- blocks edits for `viewer`

Conflict handling is version-based:

- if `_localVersion > _serverVersion`, local state is pushed
- otherwise server state is pulled

## Dependency and CPM Integration

Dependencies are stored on tasks and used by three subsystems:

- task modal dependency editor
- gantt SVG arrows
- critical path calculation

Important current behavior:

- canonical dependency format is `{ id, type, threshold }`
- arrows auto-hide full graph only when task count exceeds `50`
- `FF` dependencies are displayed, but excluded from the CPM successor graph

See `docs/DEPENDENCIES.md` for details.

## UI Architecture Notes

### Gantt toolbar

`renderGanttToolbar()` currently includes:

- task name search
- gantt multi-filters for contractor and payment state
- critical path toggle
- dependency arrows toggle
- dependency list modal opener
- category grouping toggle
- overdue reopen action
- zoom controls
- mono-color print mode

### User cabinet

`js/user.js` combines:

- local profile settings
- Supabase auth entry
- baseline controls
- theme toggle
- avatar upload/clear
- sync/logout state

### Print system

`js/print.js` has a dedicated print pipeline:

- print dialog
- preview paging
- section selection
- paper/orientation/scale settings
- printable gantt pagination
- finance print pages
- chart rasterization
- PDF generation with `html2canvas` + `jsPDF`

## Styling Structure

The CSS layer is split by responsibility:

- `variables.css`: tokens and palette
- `theme.css`: dark theme overrides
- `layout.css`: app shell
- `gantt.css`: gantt table and bars
- `modal.css`: common modal styling
- `features.css`: modal sizes and feature-specific layouts
- `finance.css`: finance pane
- `contractors.css`: contractors pane
- `charts.css`: charts pane
- `costs.css`: task cost editor
- `controls.css`: shared control styling
- `print.css`: print/PDF styles

`controls.css` is the shared override layer for buttons, inputs, selects, filter panels, and recurring interaction states.
