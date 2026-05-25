# Plan Master - Technical Migration Plan

> Status: execution plan updated to match the codebase on `2026-05-20`.

## Purpose

This document answers a different question than `ROLES_AND_SHARING_PLAN.md`.

- `ROLES_AND_SHARING_PLAN.md` describes the product and access roadmap.
- `TECH_MIGRATION_PLAN.md` describes the engineering order for getting there
  without a risky full rewrite.

The project should keep these two concerns separate.

## Current Assessment

The application still runs through legacy global scripts in `index.html`, but
the most dangerous foundations are no longer in the original mixed state.

What is true now:

- the capability model is already introduced in runtime code
- project roles are already `owner / manager / editor / viewer`
- Supabase schema, RLS, and sharing flows already support that model
- audit logging foundation already exists
- a first TypeScript and generated-helper bridge already exists
- module-based UI islands now exist for the user cabinet, auth-only cabinet flows, audit viewer, share modal, project settings, project manager, app shell, overdue banner, gantt surface, print dialog shell, print chart picker, chart edit dialog, task modal shell, notes modal, dependency list modal, contractor entry modal, contractor detail and register surface, contractor dialog flows, payment register modal, contractor tools menu, contractor import/review shell, finance chart controls, and finance surface

What is still legacy:

- runtime bootstrap still depends on classic `<script>` orchestration
- UI still relies heavily on global state and inline handlers
- large files like `js/modal.js`, `js/user.js`, and parts of `js/api.js`
  still mix UI orchestration with domain decisions

So the main problem is no longer "JavaScript". The main remaining problem is
legacy runtime composition.

## Target Direction

Recommended target stack remains:

- `Vite`
- `TypeScript`
- `React`
- `Zustand`
- `Zod`
- `Supabase`

But migration should remain incremental. The repo is no longer at the stage
where a blind rewrite would help.

## Progress Snapshot

### Phase 0 - Capability model

Status: `completed`

Implemented outcome:

- runtime capability model exists
- role matrix is aligned around:
  - `canViewProject`
  - `canEditTasks`
  - `canManageProject`
  - `canManageShares`
  - `canViewAuditLog`

Residual work:

- keep future UI slices aligned with these capabilities

### Phase 1 - Modular decomposition without UI stack rewrite

Status: `completed for current scope`

Implemented outcome:

- permission logic has a dedicated layer
- project access, sync, storage, and presentation helpers are extracted
- Supabase runtime is partially decomposed behind generated helpers
- the app no longer depends on a single monolithic `supabase-api.js` for every
  pure transformation

Residual work:

- preserve the same permission semantics during later UI migration
- keep new runtime slices aligned with the same capability model

### Phase 2 - TypeScript bootstrap

Status: `completed`

Implemented outcome:

- TypeScript toolchain is active
- typed contracts exist for permissions, audit, storage, sync, access, and
  Supabase payload mapping
- generated runtime helper bridge is built from typed source modules
- helper verification exists through `npm run verify:supabase-helpers`

Reference:

- `docs/PHASE2_TYPESCRIPT_BOOTSTRAP.md`

### Phase 3 - Roles and sharing

Status: `implemented, stabilization complete for current scope`

Implemented outcome:

- role model is `owner / manager / editor / viewer`
- project sharing works end-to-end
- role-aware readonly and mutation guards are in place
- own vs shared project presentation is implemented
- access banner and role labels are aligned across runtimes

Residual work:

- future refactors must preserve the same capability semantics

### Phase 4 - Audit log

Status: `foundation completed, basic read UI implemented`

Implemented outcome:

- `activity_log` schema exists
- client writes task, project, baseline, and share events
- read API exists
- a lightweight read-only audit viewer exists in the user cabinet

Residual work:

- richer audit timeline UI
- possible filtering, grouping, and pagination

### Phase 5 - Company / org decision

Status: `not started by design`

This remains an architectural checkpoint, not the next automatic coding step.

Questions still to answer before building it:

- Is project-level sharing still enough for the product?
- Is there a real need for company-wide visibility and membership?
- Do we need shared people catalogs and org onboarding?

### Phase 6 - Invite system

Status: `deferred until org decision`

If company scope is postponed, the likely next step is lightweight invite links
at the project level rather than a full org invite model.

### Phase 7 - Company / org model

Status: `not started`

This is still a separate large initiative, not a continuation of the current
role and sharing work.

### Phase 8 - UI migration to React

Status: `not started`

This is still the right long-term direction, but only after enough legacy UI
areas are isolated and stable.

## Recommended Next Engineering Step

The next correct step is not another database redesign. It is continued runtime
decomposition of the legacy UI layer.

Best next targets:

1. extract one more pure UI/domain slice from `js/modal.js` or `js/user.js`
2. reduce global coupling in legacy UI state transitions
3. choose the first area that can move from legacy globals to a module-based UI
   bootstrap without touching the gantt core

Good candidates for the next module-based UI islands:

- remaining print dialog orchestration outside the shell
- remaining finance modal/editor flows outside the current pane surface
- any last contractor dialog-specific listeners that are not yet under the island

Bad candidates for the first UI island:

- gantt grid
- drag/resize core
- print pipeline

## What Not To Do

- do not start a full React rewrite yet
- do not introduce company tables just because roles now work
- do not reintroduce binary access checks
- do not mix audit and notifications into one vague feature bucket
- do not start UI migration from gantt or print subsystems

## Document Map

Recommended reading order:

1. `docs/ROLES_AND_SHARING_PLAN.md`
2. `docs/TECH_MIGRATION_PLAN.md`
3. `docs/PHASE1_IMPLEMENTATION_BACKLOG.md`
4. `docs/PHASE2_TYPESCRIPT_BOOTSTRAP.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DATABASE.md`

Document roles:

- `ROLES_AND_SHARING_PLAN.md` answers `what we are building`
- `TECH_MIGRATION_PLAN.md` answers `in what technical order we build it`
- `PHASE1_IMPLEMENTATION_BACKLOG.md` answers `what we already executed for the
  roles/sharing phase`
- `PHASE2_TYPESCRIPT_BOOTSTRAP.md` answers `what was added to stabilize typed
  contracts before deeper runtime migration`

## Summary

The repo is past the dangerous early migration stage.

What is already closed enough not to revisit for the current migration scope:

- capability model
- project role model
- sharing foundation
- Supabase schema and RLS repair for the new role model
- TypeScript bootstrap
- Phase 1 roles/sharing decomposition

What remains ahead:

- more legacy runtime decomposition
- a later UI bootstrap shift
- only after that, any decision about company-level architecture

