# Plan Master - Phase 3 React Transition Plan

> Status: planned on `2026-05-30` from the completed migration baseline.

## Purpose

This document defines the next major engineering phase after the completed
legacy-runtime migration.

The goal is not another cleanup pass inside `js/*`. The goal is a controlled
transition to the same frontend stack that is already used by the other
product in the ecosystem.

## Baseline Snapshot

Current baseline before the React transition:

- the current migration scope is completed
- role model, sharing, sync, storage, and audit foundation are already stable
- Supabase schema and RLS already support the current permission model
- a TypeScript layer already exists
- generated runtime helpers already isolate a large part of domain and service
  logic from the old UI shell
- module-based UI islands already cover the main user-facing shells

This matters because the React transition can start from extracted domain logic
instead of from a raw monolith.

## Why This Phase Exists

The product no longer lives in isolation.

There is already another application on `React`, and the long-term direction is
to build a shared ecosystem for project management. That changes the decision
criteria:

- shared stack reduces maintenance cost
- shared stack simplifies cross-product data exchange
- shared stack makes shared auth, roles, audit, and UI rules easier to evolve
- shared stack reduces duplicated engineering effort

So this phase is not a cosmetic rewrite. It is ecosystem alignment.

## Target Stack

Recommended target stack for this application:

- `React`
- `TypeScript`
- `Vite`
- `Zustand`
- `Zod`
- `Supabase`

Optional later layer, only if ecosystem needs it:

- shared internal packages for `domain`, `ui`, and `supabase contracts`

## Transition Principles

Rules for this phase:

1. do not rewrite everything at once
2. do not replace stable domain logic if it can be reused
3. keep Supabase contracts backward-compatible during UI transition
4. move screen-by-screen and subsystem-by-subsystem
5. keep the legacy app runnable until the new React shell reaches feature parity

## What Can Be Reused

The previous migration created assets that should be reused directly:

- typed domain helpers in `src/domain/*`
- typed Supabase helpers in `src/services/supabase/*`
- generated runtime bridge patterns in `src/runtime/*`
- permission semantics already implemented in runtime
- audit payload contract and activity log schema
- storage/sync normalization rules

The React transition should consume these layers first, then replace the old UI
shell around them.

## Proposed Execution Order

### Stage 0 - React Host Bootstrap

Goal:

- create a React app shell inside the current repo without removing the old app

Deliverables:

- React entrypoint
- app-level providers
- Zustand store skeleton
- typed app shell router/state
- shared bridge to current project data

Success criteria:

- React shell can mount alongside the legacy app in development
- no production feature is removed

### Stage 1 - Shared Domain and Store Alignment

Goal:

- make React the primary consumer of extracted domain logic

Deliverables:

- Zustand stores for:
  - session/auth
  - project collection
  - current project
  - UI modal state
- adapter layer that maps current helper outputs into store actions

Success criteria:

- React components can read/write the same project state model
- no duplicated business rules between legacy JS and React state

### Stage 2 - Low-Risk UI Screens First

Recommended order:

1. user cabinet
2. auth flows
3. audit viewer
4. share modal
5. project manager
6. project settings

Why:

- these areas already have strong helper isolation
- they are less risky than gantt rendering
- they create immediate stack alignment with the other application

Success criteria:

- these screens run fully in React
- legacy handlers for those screens are no longer used

### Stage 3 - Main Workspace Shell

Goal:

- replace legacy top-level app shell with React

Deliverables:

- React app shell for tabs, top bar, sync badge, project selector, and banners
- compatibility bridge for remaining legacy surfaces

Success criteria:

- global app navigation is React-driven
- legacy code becomes embedded feature logic, not the root shell

### Stage 4 - Gantt Surface and Task Modal

Goal:

- migrate the most central project editing experience

Deliverables:

- React gantt surface
- React task modal
- React dependency list
- React notes flow

Notes:

- this is one of the highest-risk stages
- do not start here before earlier shells are stable

Success criteria:

- task create/edit/delete works through React
- gantt rendering and interaction no longer depend on legacy inline glue

### Stage 5 - Contractors, Costs, and Finance

Goal:

- migrate business-heavy operational surfaces

Deliverables:

- React contractors surface
- React contractor dialogs
- React cost editor
- React finance surface
- React payment register flows

Success criteria:

- operational finance/contractor workflows are React-driven
- old contractor/finance shell islands can be retired

### Stage 6 - Print and Charts Rework

Goal:

- treat `print` and parts of `charts` as product redesign, not just migration

Deliverables:

- React-based chart configuration flows
- rebuilt print/export UX
- clarified PDF/export pipeline

Success criteria:

- print/export behavior is explicitly redesigned and tested
- no attempt to preserve broken UX only for parity

### Stage 7 - Legacy Runtime Retirement

Goal:

- remove the old browser-runtime shell

Deliverables:

- retired `index.html` orchestration as primary app runtime
- removal of obsolete `js/*` glue that React no longer needs
- updated docs and deployment flow

Success criteria:

- React is the primary runtime
- legacy bridge is either deleted or reduced to isolated compatibility adapters

## Risks

Main risks of this phase:

- duplicating business logic in both legacy JS and React
- trying to migrate gantt too early
- changing Supabase contracts while two runtimes coexist
- underestimating `print/charts` as product redesign work

Risk control:

- keep one domain source of truth
- migrate in the recommended order
- keep each stage independently testable
- avoid broad schema changes during UI migration

## Definition of Done

This phase is complete only when:

- the primary user workflows run in React
- legacy global-script runtime is no longer the main UI shell
- shared ecosystem maintenance is realistically simpler on one stack
- documentation no longer describes this app as a legacy-runtime product

## Immediate Next Step

The correct first coding step after approving this plan:

1. create the React host bootstrap
2. wire Zustand store skeleton to existing typed helpers
3. migrate `user cabinet` and `auth flows` first

That keeps risk low and creates the first real shared-stack foundation with the
other React product.
