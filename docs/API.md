# API and Backend Adapters

## Current Reality

This repository contains two client-side backend adapters:

- `js/supabase-api.js` — active adapter
- `js/api.js` — reserve adapter for Express + MongoDB

`index.html` currently loads only Supabase:

```html
<!-- <script src="./js/api.js"></script> -->
<script src="./js/supabase-api.js"></script>
```

## Primary Backend: Supabase

The application currently works against Supabase directly from the browser.

### Main responsibilities in `js/supabase-api.js`

- auth: register, login, logout, session restore
- profile loading and update
- project list loading
- project create/load/update/delete
- task sync through RPC
- project sharing
- readonly role handling

### Main tables and RPC used

- `profiles`
- `projects`
- `project_shares`
- `tasks`
- RPC `upsert_tasks(p_project_id, p_tasks)`
- RPC `get_user_id_by_email(p_email)`

For schema details, use `docs/DATABASE.md`.

## Reserve Backend: Express + MongoDB

`js/api.js` is still present as a fallback adapter. It models the same high-level client API:

- `apiRegister`
- `apiLogin`
- `apiLogout`
- `apiGetMe`
- `apiLoadProjects`
- `apiLoadProject`
- `apiSyncProject`
- `apiCreateProject`
- `apiDeleteProject`
- sharing helpers

It is not active in the current HTML shell.

## Runtime Contract Between UI and Backend

Regardless of adapter, the UI expects these capabilities:

- authenticate a user
- load project list
- load one project with role information
- persist project metadata
- persist the full task list
- manage sharing roles

The Supabase adapter is the reference implementation for current behavior.

## Legacy REST Shape

If the reserve backend is re-enabled, its documented REST surface is approximately:

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/profile`

### Projects

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

### Tasks

- `GET /api/v1/projects/:id/tasks`
- `PUT /api/v1/projects/:id/tasks/bulk`

### Sharing

- `GET /api/v1/projects/:id/shares`
- `POST /api/v1/projects/:id/shares`
- `PATCH /api/v1/projects/:id/shares/:userId`
- `DELETE /api/v1/projects/:id/shares/:userId`

## Adapter Rule

Only one adapter must be enabled at a time.

- enable `js/supabase-api.js` for the current production-like flow
- enable `js/api.js` only if you intentionally switch to the reserve REST backend
