# Plan Master - Roles, Sharing, and Future Expansion

> Status: product and access roadmap updated to match the codebase on
> `2026-05-20`.

Related execution documents:

- `docs/TECH_MIGRATION_PLAN.md` - engineering order and migration stages
- `docs/PHASE1_IMPLEMENTATION_BACKLOG.md` - concrete backlog for the completed
  project-role implementation pass
- `docs/PHASE2_TYPESCRIPT_BOOTSTRAP.md` - typed helper and bridge foundation

## What Already Exists

### Working project-level sharing

The application already has a working project sharing system:

- `project_shares`
- project owner through `projects.owner_id`
- roles `viewer`, `editor`, and `manager`
- implicit `owner`
- sharing by email
- role updates
- share removal
- readonly behavior for non-edit roles

### Implemented runtime permission model

The active runtime already uses capability-style checks:

- `canEditTasks()`
- `canManageProject()`
- `canManageShares()`
- `canViewAuditLog()`

This means the roadmap is no longer describing a hypothetical foundation. It is
describing how to extend an already working access model.

### Implemented audit foundation

The application already includes:

- `activity_log`
- audit event writing for task, share, baseline, and project mutations
- audit read API
- a lightweight read-only audit viewer in the user cabinet

This is not yet a full enterprise audit timeline, but the foundation is real
and active.

## Current Effective Role Matrix

| Role | View project | Edit tasks | Manage project settings | Manage shares | View audit log |
|---|---|---|---|---|---|
| `viewer` | yes | no | no | no | no |
| `editor` | yes | yes | no | no | yes |
| `manager` | yes | yes | yes | yes | yes |
| `owner` | yes | yes | yes | yes | yes |

Notes:

- `owner` is not stored in `project_shares.role`
- ownership comes from `projects.owner_id`

## What This Roadmap Still Covers

This document is still useful, but it should now be read as:

- current product state
- next product increments
- later expansion options

not as a description of an unimplemented sharing foundation.

## Completed Product Step

### Phase 1 - Granular project roles

Status: `implemented for the current application scope`

Delivered outcome:

- migrated away from legacy `admin`
- introduced `manager`
- aligned mutation guards and readonly behavior with the role matrix
- implemented role-aware share management
- separated own vs shared project presentation

This phase should now be treated as closed unless a bug or regression appears.

## Next Product-Meaningful Step

### Phase 2 - Better audit UX

Status: `next practical expansion`

The backend-first audit foundation exists already. The next product step is to
make it more useful in the UI.

Potential improvements:

- richer timeline presentation
- filtering by event type
- grouping by date or actor
- better labels for changed entities

This is a natural next step because the system already records the events.

## Decision Point: Company / Org Layer

### Phase 3 - Company model

Status: `deferred until explicitly justified`

This should not be treated as the automatic next feature.

Only build it if the product genuinely needs:

- company-wide membership
- cross-project visibility at organization scope
- centralized people and access management
- org onboarding and admin flows

If those needs are still weak, project-level sharing should remain the main
collaboration model.

## Invite Strategy

### Phase 4 - Invite links or pending invites

Status: `optional next collaboration layer`

The app already supports direct sharing by email. The next lightweight
collaboration enhancement would be:

- tokenized invite links
- pending invite acceptance flow

This can happen with or without a company model.

## Notifications

### Phase 5 - Notifications

Status: `later`

Notifications are still relevant, but they should come after:

- stable roles
- stable sharing flows
- stable audit events

Without those pieces, notifications do not yet have a strong event model behind
them.

## Practical Priority Order

From the current codebase state, the most sensible product order is:

1. keep the current role model stable
2. improve audit usability
3. decide whether project-level invites are enough
4. decide whether a real company layer is needed
5. only then consider notifications and org visibility rules

## Summary

The key shift is this:

- project-level roles and sharing are no longer "planned"
- they are already part of the product
- the next roadmap question is not "how do we add sharing?"
- the next roadmap question is "do we deepen audit and collaboration, or do we
  jump to a real org model?"
