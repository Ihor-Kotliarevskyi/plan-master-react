# Phase 2: TypeScript Bootstrap

Status: `completed` on `2026-05-20`

## Purpose

This document tracks the first incremental TypeScript layer for the project.

The goal is not to rewrite the current UI runtime. The goal is to create typed
contracts for new modules so future refactors of permissions, sharing, audit,
and Supabase adapters happen against stable interfaces.

## What is already added

- `typescript` as a dev dependency
- `npm run typecheck`
- `tsconfig.json`
- typed domain contracts in:
  - `src/domain/types.ts`
  - `src/domain/permissions.ts`
  - `src/domain/audit.ts`
  - `src/domain/audit-ui.ts`
  - `src/domain/account-ui.ts`
  - `src/domain/auth-ui.ts`
  - `src/domain/profile-ui.ts`
  - `src/domain/baseline-ui.ts`
  - `src/domain/settings-ui.ts`
  - `src/domain/account-section-ui.ts`
  - `src/domain/modal.ts`
  - `src/domain/modal-orchestration.ts`
  - `src/domain/modal-panels.ts`
  - `src/domain/modal-ui.ts`
  - `src/domain/render.ts`
  - `src/domain/render-ui.ts`
  - `src/domain/app-ui.ts`
  - `src/domain/api-ui.ts`
  - `src/domain/charts-ui.ts`
  - `src/domain/finance-ui.ts`
  - `src/domain/print-ui.ts`
  - `src/domain/storage-ui.ts`
  - `src/domain/contractors-ui.ts`
  - `src/domain/costs-ui.ts`
  - `src/domain/guard-ui.ts`
  - `src/domain/user-feedback-ui.ts`
  - `src/domain/project-lifecycle.ts`
  - `src/domain/project-import.ts`
  - `src/domain/charts.ts`
  - `src/domain/costs.ts`
  - `src/domain/finance.ts`
  - `src/domain/contractors.ts`
  - `src/domain/contractors-panel.ts`
  - `src/domain/print.ts`
- typed Supabase row/RPC contracts in:
  - `src/services/supabase/contracts.ts`
- typed fallback API helpers in:
  - `src/services/api/account-runtime.ts`
  - `src/services/api/fallback-runtime.ts`
  - `src/services/api/http-runtime.ts`
- typed Supabase extraction helpers in:
  - `src/services/supabase/mappers.ts`
  - `src/services/supabase/payloads.ts`
  - `src/services/supabase/project-list.ts`
  - `src/services/supabase/runtime.ts`
  - `src/services/supabase/auth-runtime.ts`
  - `src/services/supabase/account-runtime.ts`
  - `src/services/supabase/ui-runtime.ts`
  - `src/services/supabase/collaboration-runtime.ts`
  - `src/services/supabase/project-runtime.ts`
- fixture-based verification script:
  - `npm run verify:supabase-helpers`
  - `scripts/verify-supabase-helpers.ts`

## What this does not change yet

- the app still runs through legacy `<script>` files in `index.html`
- current runtime permissions still execute from `js/permissions.js`
- current Supabase runtime still executes from `js/supabase-api.js`
- there is still no module-based runtime switch for the app bootstrap

## What is integrated now

- `src/runtime/supabase-runtime-helpers.ts` is bundled into:
  - `js/generated/supabase-runtime-helpers.generated.js`
- the generated bridge exposes the first runtime helper layer for:
  - buffered project analysis
  - accessible project merging
  - fallback accessible-project normalization
  - shared-vs-own project grouping for legacy UI lists
  - shared-project owner/inviter label extraction
  - sync-state and sync-badge calculation
  - local snapshot meta/version calculation
  - storage buffer payload building
  - buffered project role normalization
  - access/role presentation helpers for legacy UI
  - task row mapping
  - project snapshot building
  - project mutation/insert payload building
  - share row mapping
  - activity row mapping
  - activity insert payload building
  - share upsert/update payload building
  - activity payload splitting
  - `upsert_tasks(...)` payload building
- `js/supabase-api.js` now uses that runtime helper layer in:
  - `apiLoadProjects()`
  - `apiLoadProject()`
  - `apiSyncProject()`
  - `apiCreateProject()`
  - `apiGetShares()`
  - `apiGetActivityLog()`
  - `apiLogActivity()`
  - `apiShareProject()`
  - `apiUpdateShareRole()`
  - `_buildTasksPayload()`
  - project load-vs-sync decision
  - current project resolution after bootstrap
  - synced snapshot version update
  - created snapshot server-id/owner-role update
  - auth redirect URL construction
  - register/login request construction
  - profile select/update request construction
  - auth-state reset and hydration model
  - logout sync-decision
  - auth-event planning for `INITIAL_SESSION` / `SIGNED_IN` / `TOKEN_REFRESHED` / `USER_UPDATED` / `SIGNED_OUT`
  - readonly/share-button UI state model
  - share modal list projection
  - share role option and guide rendering helpers
  - share success toast models
  - sync-indicator timing plan
  - activity write request model
  - activity read request model
  - share grant normalization/request/result
  - share lookup/target validation/upsert options
  - share role update request/result
  - share list RPC/fallback request models
  - share remove request model
  - activity log limit resolution
  - loaded-project role resolution
  - project create/sync request construction
  - task RPC request construction and create-time rebinding
  - project delete request model
- `js/render.js` and `js/modal.js` now use the generated helper layer for:
  - grouping project lists into own/shared sections
  - deriving shared-project owner/inviter labels
- `js/render.js` now uses the generated helper layer for:
  - header date-range projection
  - legend chip state projection
  - visible year-group projection
  - task row / bar / phase window projection
- `js/modal.js` now uses the generated helper layer for:
  - project settings update and timeline-shift orchestration
  - empty-project and demo-project snapshot creation
  - delete-project guard evaluation
  - next-project resolution after deletion
  - task modal edit-state projection
  - task modal save-model construction
  - task save apply/update orchestration
  - task remove-at mutation helper
  - note add/edit/delete state mutation
  - visible note-count calculation
  - category draft cloning/add/remove helpers
  - category-in-use detection
  - project manager grouped row projection
  - modal phase/date conversion helpers
  - weighted progress and active-phase resolution
  - task cost summary calculation for modal footer
  - dependency-list aggregation and filtered row projection
- `js/baseline.js` and `js/guard.js` now use the generated helper layer for:
  - baseline save/clear/missing dialogs
  - capability-guard action labels and denial toasts
- `js/costs.js` now uses the generated helper layer for:
  - cost table empty state
  - totals/footer labels
  - contract/payment placeholders
  - payment count/action labels
  - cost item and payment mutation helpers
  - cost total aggregation
  - expanded-payment-row toggle logic
- `js/finance.js` now uses the generated helper layer for:
  - filter/search labels
  - bulk delete confirmation copy
  - chart dataset and tooltip labels
  - finance filter-state detection
  - scoped cost-item and payment aggregation
  - finance search text building
  - deletion summary calculation
  - overview KPI calculation
  - finance row enrichment and sorting
- `js/charts.js` now uses the generated helper layer for:
  - axis and title labels
  - chart action tooltips
  - auto-chart preset titles
  - chart data aggregation
  - group color resolution
  - chart render-type normalization
  - chart options model building
  - auto-preset default lookup
  - chart definition building for custom and auto charts
- `js/print.js` now uses the generated helper layer for:
  - print dialog empty states
  - print-section normalization
  - print settings normalization
  - report/page titles
  - print metrics calculation
  - preview loading and page-count labels
  - preview pagination and geometry state
  - planned/actual chart labels
  - PDF export feedback copy
  - PDF page-progress copy
  - gantt print layout resolution
- `js/storage.js` now uses the generated helper layer for:
  - offline sync-indicator copy
- `js/user.js` now uses the generated helper layer for:
  - project sync-state calculation
  - sync-badge resolution
  - preferred sync-status fallback logic
  - audit event and subject presentation helpers
  - account sync panel model building
  - auth form/tab model building
  - user identity and theme-toggle model building
  - baseline panel model building
  - defaults/theme settings panel model building
  - cloud account section labels and sync detail captions
  - baseline section title model building
  - audit modal labels and empty/error copy
  - auth/profile toast and dialog copy
  - task modal alert/toast copy
  - project manager dialog and grouping labels
  - notes modal labels and confirm dialogs
  - category editor labels and delete confirms
  - dependency list empty-state copy
  - dependency editor labels, tooltips, and filter captions
  - dependency list headers and critical-path tooltips
  - project selector labels
  - gantt toolbar labels
  - task row labels and notes/phase captions
  - app import-conflict dialogs and import/copy feedback labels
  - XLSX sheet/header labels
  - overdue banner labels and duration formatting
  - contractor summary, filters, table headers, and selection labels
  - baseline dialogs/toasts
  - access-guard capability labels and denial toast copy
- `js/contractors.js` now uses the generated helper layer for:
  - contractor row aggregation and sorting
  - contractor summary aggregation
  - contractor filter-state detection
  - selected-key normalization
  - visible bulk-delete row resolution
  - bulk delete normalization and summary calculation
  - payment register current-state calculation
  - saved payment-register list projection
  - saved payment-register snapshot creation
  - payment-register lookup by id
  - payment register filter-summary text
  - payment and act modal field labels
  - contractor import mapping default-option labels
  - contractor import review filter and table labels
  - contractor import decision labels
  - import-review validation copy
- `js/api.js` now uses the generated helper layer for:
  - auth modal labels and submit copy
  - auth success/error/logout prompt copy
  - fallback auth modal render model
  - fallback auth button state model
  - fallback HTTP request header construction
  - fallback HTTP/session outcome resolution
  - share modal titles, empty states, and validation copy
  - fallback auth reset and hydration state
  - fallback register/login request construction
  - fallback profile update request construction
  - fallback sync-indicator plan
  - fallback project shell projection
  - fallback loaded-project snapshot projection
  - fallback project sync/create/delete request construction
  - fallback share grant/update/remove request construction
  - fallback share modal state projection
- `js/storage.js`, `js/modal.js`, and `js/app.js` now use the generated helper layer for:
  - initial local snapshot meta creation
  - persisted buffer payload shape
  - buffered role normalization
- `js/app.js` now uses the generated helper layer for:
  - task copy snapshot building
  - project-name collision checks and unique-name suggestion
  - imported baseline remapping
  - imported project snapshot normalization from legacy JSON
- `js/supabase-api.js`, `js/api.js`, `js/modal.js`, `js/render.js`, and `js/user.js` now use the generated helper layer for:
  - role labels
  - shared-project presentation text
  - access banner display model

## Why this is the right next step

- `Phase 1` and stabilization are already working end-to-end
- the next risk is uncontrolled refactoring of data contracts
- typed contracts reduce regression risk before deeper extraction from
  `js/supabase-api.js`

## Next recommended steps

1. Start the next migration stage from a stable helper bridge instead of adding new ad-hoc global logic.
2. Decide when enough runtime slices are isolated to justify a broader module bootstrap.
3. Keep extending fixture coverage as new pure helpers are extracted beyond the bootstrap scope.

## Notes

- `vite.config.mjs` now suppresses the known legacy warning about classic
  `<script>` tags without `type="module"`.
- This does not modernize the runtime yet; it only removes noisy expected output
  while the app still bootstraps through legacy scripts.
- `npm run build` and `npm run dev` now generate the runtime bridge before
  starting Vite work, so the legacy app consumes a current typed helper bundle.
