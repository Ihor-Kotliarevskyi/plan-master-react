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
  - `src/domain/modal-ui.ts`
  - `src/domain/render-ui.ts`
  - `src/domain/app-ui.ts`
  - `src/domain/user-feedback-ui.ts`
- typed Supabase row/RPC contracts in:
  - `src/services/supabase/contracts.ts`
- typed Supabase extraction helpers in:
  - `src/services/supabase/mappers.ts`
  - `src/services/supabase/payloads.ts`
  - `src/services/supabase/project-list.ts`
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
- `js/render.js` and `js/modal.js` now use the generated helper layer for:
  - grouping project lists into own/shared sections
  - deriving shared-project owner/inviter labels
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
- `js/storage.js`, `js/modal.js`, and `js/app.js` now use the generated helper layer for:
  - initial local snapshot meta creation
  - persisted buffer payload shape
  - buffered role normalization
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
