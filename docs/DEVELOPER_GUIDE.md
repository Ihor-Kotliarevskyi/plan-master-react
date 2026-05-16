# Developer Guide

## Run Locally

The project is a static app. Serve the repository root over HTTP:

```bash
python -m http.server 8080
```

or

```bash
npx serve .
```

Then open `http://localhost:8080`.

## Backend Selection

`index.html` currently enables:

```html
<script src="./js/supabase-api.js"></script>
```

and keeps the reserve adapter disabled:

```html
<!-- <script src="./js/api.js"></script> -->
```

Do not enable both at once.

## Module Map

### If you need to change gantt behavior

- `js/render.js`: table rendering, toolbar, grouping, gantt filters
- `js/drag.js`: bar drag and resize
- `js/critical.js`: critical path
- `js/dep-arrows.js`: arrows and chain highlighting
- `js/baseline.js`: baseline rendering

### If you need to change task editing

- `js/modal.js`: task modal, phases, dependencies, notes, project manager
- `js/costs.js`: cost items, payments, auto budget/spent logic

### If you need to change finance

- `js/finance.js`: S-curve, weekly costs, EVM, finance table, finance filters
- `css/finance.css`

### If you need to change contractors/registers/import

- `js/contractors.js`
- `css/contractors.css`

### If you need to change auth/profile/theme

- `js/user.js`
- `js/supabase-api.js`
- `css/theme.css`
- `css/controls.css`

### If you need to change print/PDF

- `js/print.js`
- `css/print.css`

## State and Persistence Rules

### Project data

Project snapshots are stored in `allProjects[currentId]` and copied into runtime variables:

- `proj`
- `cats`
- `tasks`
- `nextN`

### Saving

After mutating project data, use:

```js
saveAll();
render();
```

This is the default persistence path. `saveAll()`:

- snapshots state into `allProjects`
- updates `_localVersion`
- writes `gantt_buf` to `localStorage`
- schedules Supabase sync when logged in

### UI state

UI preferences are stored separately in `gantt_pro_ui`, including:

- active tab
- zoom
- hidden categories
- gantt filters
- finance tab
- weekly-cost-chart visibility
- finance chart height

## Current Data Conventions

### Dependencies

Use:

```js
{ id, type, threshold }
```

Do not add new code that depends on legacy numeric/string dependency refs.

### Cost items

Task estimates are stored on:

```js
task.costItems = [{
  id,
  type,
  name,
  supplier,
  unit,
  qty,
  unitPrice,
  contractNo,
  contractDate,
  acts: [],
  payments: []
}];
```

The contractors pane is derived from `supplier` and nested payments. There is no standalone contractors table in runtime state.

## Common Change Paths

### Add a new top-level toolbar control on gantt

Edit:

- `js/render.js`
- optional styles in `css/layout.css` or `css/controls.css`

### Add a new setting to the user cabinet

Edit:

- `js/user.js`
- `USER_SK` persistence if local-only
- `apiUpdateProfile()` flow if it must sync to Supabase

### Add a new print option

Edit:

- dialog markup in `index.html`
- settings parsing in `js/print.js`
- print page generation in `js/print.js`

### Add a new project-level filter

If it affects gantt:

- state in `js/state.js`
- persistence in `js/storage.js` / `js/render.js`
- UI rendering in `js/render.js`

If it affects finance:

- state in `js/state.js`
- UI in `js/finance.js`
- row filtering in `js/finance.js`

## Supabase Notes

Primary backend logic lives in `js/supabase-api.js`.

Current responsibilities:

- auth session handling
- profile loading/updating
- project list loading
- project sync
- task sync through RPC `upsert_tasks`
- project sharing and readonly role enforcement

Database-side details belong in `docs/DATABASE.md`.

## Readonly Mode

Readonly behavior is role-based:

- `viewer` can load and inspect
- edit UI is partially hidden/blocked
- gantt interaction is disabled in `_updateReadOnlyUI()`

When adding editing affordances, make sure they respect `canEdit()`.

## Print/PDF Notes

The print subsystem is not a trivial `window.print()` wrapper. It:

- builds a dedicated print DOM tree
- paginates gantt weeks/tasks
- renders chart images
- supports preview page switching
- exports PDF through `html2canvas` and `jsPDF`

If you change gantt layout widths or chart rendering, verify print output too.

## Review Checklist

- Did you mutate project data through `saveAll()`?
- Did you rerender the active pane after the change?
- Did you preserve readonly behavior?
- Did you keep dependency ids UUID-based?
- Did you verify localStorage-backed UI state if you changed filters/toggles?
- Did you verify print output if the change affects gantt, finance, or charts?
