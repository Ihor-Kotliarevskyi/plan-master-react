# Phase 2: TypeScript Bootstrap

Status: `started` on `2026-05-19`

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

## What is partially integrated now

- `src/runtime/supabase-runtime-helpers.ts` is bundled into:
  - `js/generated/supabase-runtime-helpers.generated.js`
- the generated bridge exposes the first runtime helper layer for:
  - buffered project analysis
  - accessible project merging
  - fallback accessible-project normalization
  - shared-vs-own project grouping for legacy UI lists
  - shared-project owner/inviter label extraction
  - sync-state and sync-badge calculation
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

## Why this is the right next step

- `Phase 1` and stabilization are already working end-to-end
- the next risk is uncontrolled refactoring of data contracts
- typed contracts reduce regression risk before deeper extraction from
  `js/supabase-api.js`

## Next recommended steps

1. Keep extending fixture coverage as more pure helpers are extracted.
2. Move the remaining duplicated fallback/lookup helpers into the runtime helper layer.
3. Keep the legacy UI calling stable wrappers until enough code is migrated to justify a runtime switch.
4. Decide when enough UI/domain helpers are extracted to justify a broader module bootstrap.

## Notes

- `vite.config.mjs` now suppresses the known legacy warning about classic
  `<script>` tags without `type="module"`.
- This does not modernize the runtime yet; it only removes noisy expected output
  while the app still bootstraps through legacy scripts.
- `npm run build` and `npm run dev` now generate the runtime bridge before
  starting Vite work, so the legacy app consumes a current typed helper bundle.
