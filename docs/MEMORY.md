# Documentation Memory

## Current Snapshot

Last reviewed: `2026-05-16`

- App type: static SPA without build step (`index.html` + modular `js/` + modular `css/`).
- Active backend: `js/supabase-api.js`.
- Reserve backend: `js/api.js` exists, but its `<script>` is commented out in `index.html`.
- Main panes: `gantt`, `finance`, `contractors`, `charts`.
- Main overlays/modals: project settings, project manager, task modal, dependency list, print dialog, user cabinet, notes, categories.
- Persistence model: local-first via `localStorage` buffer `gantt_buf`, then debounced sync to Supabase.

## Key Runtime Facts

### Global state

`js/state.js` currently stores:

- project data: `allProjects`, `currentId`, `proj`, `tasks`, `cats`, `nextN`
- gantt view state: `hiddenCats`, `filterCat`, `groupBy`, `collapsedGrps`, `taskSearch`, `ganttFilters`
- finance state: `finSort`, `finFilters`, `showEVM`, `finActiveTab`, `showWeeklyCostBars`, `financeChartHeight`
- ui/helpers: `zoomLevel`, `monoBarColor`, `chartInstances`, `customCharts`, `tempCats`

### Active UX features

- gantt toolbar search by task name
- gantt filters by contractor and payment state
- grouping rows by category
- critical path toggle
- dependency arrows toggle
- overdue banner with reopen action
- mono-color bars mode for print/export
- finance overview/table tabs
- weekly costs chart toggle
- contractor registers and import/export flow
- print preview, browser print, PDF export
- user cabinet with theme, defaults, baseline, avatar, auth block

### Sync and access

- `saveAll()` increments `_localVersion`, writes to `gantt_buf`, then debounces sync for `800ms`
- Supabase adapter keeps `_serverVersion`, `_serverId`, `_role`
- readonly mode is enforced for `viewer`
- project sharing is available through `project_shares`

## Documentation Updated On 2026-05-16

- `ARCHITECTURE.md` now reflects the real SPA structure, active panes, global state and sync model.
- `DEPENDENCIES.md` now reflects the current dependency format `{ id, type, threshold }`, chain highlighting and CPM behavior.
- `DEVELOPER_GUIDE.md` now points to the active modules and current extension points.
- `API.md` now explains the actual backend selection: Supabase is primary, REST adapter is reserve-only.

## Known Documentation Boundaries

- `DATABASE.md` remains the source of truth for Supabase schema and RPC contracts.
- `UI_GUIDE.md` still contains useful UI context, but should be treated as secondary to current code in `index.html`, `js/modal.js`, `js/user.js`, `js/print.js`, `js/finance.js`, `js/contractors.js`.
