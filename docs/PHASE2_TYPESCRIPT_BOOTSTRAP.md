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

- `js/supabase-runtime-helpers.js` mirrors the first pure helper layer for:
  - buffered project analysis
  - accessible project merging
  - task row mapping
  - project snapshot building
  - project mutation/insert payload building
  - share row mapping
  - activity row mapping
  - activity insert payload building
  - `upsert_tasks(...)` payload building
- `js/supabase-api.js` now uses that runtime helper layer in:
  - `apiLoadProjects()`
  - `apiLoadProject()`
  - `apiSyncProject()`
  - `apiCreateProject()`
  - `apiGetShares()`
  - `apiGetActivityLog()`
  - `apiLogActivity()`
  - `_buildTasksPayload()`

## Why this is the right next step

- `Phase 1` and stabilization are already working end-to-end
- the next risk is uncontrolled refactoring of data contracts
- typed contracts reduce regression risk before deeper extraction from
  `js/supabase-api.js`

## Next recommended steps

1. Continue replacing the remaining duplicated share mutation helpers in `js/supabase-api.js`.
2. Decide when to swap the runtime helper file from plain JS to module-based generated output.
3. Keep extending fixture coverage as more pure helpers are extracted.
4. Keep the legacy UI calling stable wrappers until enough code is migrated to justify a runtime switch.

## Notes

- `vite.config.mjs` now suppresses the known legacy warning about classic
  `<script>` tags without `type="module"`.
- This does not modernize the runtime yet; it only removes noisy expected output
  while the app still bootstraps through legacy scripts.
