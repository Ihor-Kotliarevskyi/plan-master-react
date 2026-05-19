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

## What this does not change yet

- the app still runs through legacy `<script>` files in `index.html`
- current runtime permissions still execute from `js/permissions.js`
- current Supabase runtime still executes from `js/supabase-api.js`

## Why this is the right next step

- `Phase 1` and stabilization are already working end-to-end
- the next risk is uncontrolled refactoring of data contracts
- typed contracts reduce regression risk before deeper extraction from
  `js/supabase-api.js`

## Next recommended steps

1. Start using the new typed helpers when touching `js/supabase-api.js` paths.
2. Extract stable wrappers around project list, project load, sharing, and audit reads.
3. Add typed tests or fixture-based verification for payload/mapping helpers.
4. Keep the legacy UI calling stable wrappers until enough code is migrated to justify a runtime switch.
