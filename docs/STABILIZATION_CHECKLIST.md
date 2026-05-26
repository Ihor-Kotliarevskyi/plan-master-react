# Plan Master - Stabilization Checklist

> Status: working checklist for the final manual verification pass.

## How To Use

Run the blocks in order.

For each block:

- mark each step with `[x]` when done
- write short notes directly under `Notes`
- if a bug appears, record it in `Findings`

Recommended bug note format:

- `Scenario:`
- `Role:`
- `Expected:`
- `Actual:`
- `Own/shared:`
- `Online/offline:`

## Preconditions

- [ ] latest local code is pulled
- [ ] required Supabase migrations are already applied
- [ ] local app starts successfully
- [ ] test accounts exist for `owner`, `manager`, `editor`, `viewer`

Notes:

- 

Findings:

- 

## 1. Guest Flow

- [ ] open app without login
- [ ] create a local project
- [ ] add at least one task
- [ ] confirm local project remains visible after reload
- [ ] confirm sync status shows local-only or unsynced state

Notes:

- 

Findings:

- 

## 2. Auth And Session Lifecycle

- [ ] register a new user
- [ ] confirm email flow works
- [ ] login after confirmation
- [ ] reload page and confirm session is restored
- [ ] logout
- [ ] login again with the same user
- [ ] confirm UI switches to logged-in state each time

Notes:

- 

Findings:

- 

## 3. Local Buffer And Sync State

- [ ] create or update a project before login
- [ ] login and confirm local data is preserved
- [ ] confirm project syncs to cloud
- [ ] check `_localVersion` / `_serverVersion` behavior in UI diagnostics
- [ ] check `_localUpdatedAt` is shown when expected
- [ ] confirm sync state transitions make sense after edits and reload
- [ ] switch between projects and confirm sync diagnostics stay coherent

Notes:

- 

Findings:

- 

## 4. Project CRUD

- [ ] create a new empty project
- [ ] create a demo project
- [ ] rename a project
- [ ] switch between projects
- [ ] delete a project
- [ ] reload and confirm resulting project list is correct

Notes:

- 

Findings:

- 

## 5. Task CRUD And Gantt Flow

- [ ] open add-task modal
- [ ] create a task
- [ ] edit a task
- [ ] delete a task
- [ ] duplicate a task
- [ ] open notes from gantt row
- [ ] open dependency list
- [ ] drag or resize a task in gantt
- [ ] verify changes persist after reload

Notes:

- 

Findings:

- 

## 6. Roles And Capability Matrix

Run this block for each role:

- [ ] `owner`
- [ ] `manager`
- [ ] `editor`
- [ ] `viewer`

For each role verify:

- [ ] project opens correctly
- [ ] task modal open is correct
- [ ] task save/delete permissions are correct
- [ ] drag/resize permissions are correct
- [ ] dependency editing permissions are correct
- [ ] project settings permissions are correct
- [ ] share modal permissions are correct
- [ ] contractors permissions are correct
- [ ] finance permissions are correct

Notes:

- 

Findings:

- 

## 7. Sharing Flow

- [ ] owner grants access to another user
- [ ] shared user sees the project
- [ ] owner changes role for existing user
- [ ] shared user behavior updates correctly
- [ ] owner revokes access
- [ ] shared project disappears or becomes inaccessible as expected
- [ ] own/shared project grouping remains correct

Notes:

- 

Findings:

- 

## 8. Audit Log

- [ ] create a task and confirm audit event appears
- [ ] update a task and confirm audit event appears
- [ ] delete a task and confirm audit event appears
- [ ] update project settings and confirm audit event appears
- [ ] save baseline and confirm audit event appears
- [ ] clear baseline and confirm audit event appears
- [ ] grant share and confirm audit event appears
- [ ] update share role and confirm audit event appears
- [ ] revoke share and confirm audit event appears

Notes:

- 

Findings:

- 

## 9. Contractors

- [ ] open contractor surface
- [ ] create contractor entry
- [ ] edit contractor data
- [ ] add contract
- [ ] add act
- [ ] add payment
- [ ] open payment register
- [ ] save register
- [ ] import contractor data
- [ ] verify readonly behavior for restricted roles

Notes:

- 

Findings:

- 

## 10. Finance

- [ ] open finance tab
- [ ] switch finance views or filters
- [ ] open linked cost editor
- [ ] create or edit cost item
- [ ] add payment in cost editor
- [ ] delete finance row or cost item
- [ ] navigate from finance back to gantt
- [ ] verify readonly behavior for restricted roles

Notes:

- 

Findings:

- 

## 11. Print And Charts

- [ ] open print dialog
- [ ] change print options and confirm preview refreshes
- [ ] try print flow
- [ ] try PDF export flow
- [ ] open chart edit dialog
- [ ] add custom chart
- [ ] remove custom chart
- [ ] print chart

Notes:

- 

Findings:

- 

## 12. Offline And Reconnect

- [ ] go offline
- [ ] edit project data while offline
- [ ] confirm offline state is visible
- [ ] reconnect
- [ ] confirm sync resumes
- [ ] confirm offline changes are not lost

Notes:

- 

Findings:

- 

## 13. Import / Export And Legacy Snapshots

- [ ] export JSON
- [ ] import JSON while logged in
- [ ] import JSON while logged out, then login
- [ ] verify imported project still has correct sync state
- [ ] verify imported project still has correct role normalization

Notes:

- 

Findings:

- 

## Exit Criteria

- [ ] no blocker in auth/session flow
- [ ] no blocker in sync flow
- [ ] role matrix behaves correctly for MVP
- [ ] sharing is stable for own and shared projects
- [ ] audit log is written consistently for main mutations
- [ ] offline/reconnect does not lose data
- [ ] findings list is captured clearly enough for targeted fixes

Final Notes:

- 
