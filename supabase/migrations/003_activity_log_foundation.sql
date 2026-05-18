-- Phase 2 foundation: backend-first audit log.
-- Adds write-only activity logging now; read/timeline UI can be layered later.

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_email text,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_log_project_created_idx
  on public.activity_log(project_id, created_at desc);

create index if not exists activity_log_actor_created_idx
  on public.activity_log(actor_id, created_at desc);

grant select, insert on public.activity_log to authenticated;
grant select, insert, update, delete on public.activity_log to service_role;
revoke all on public.activity_log from anon;
revoke update, delete on public.activity_log from authenticated;

alter table public.activity_log enable row level security;

drop policy if exists "activity_log_select_if_project_auditor" on public.activity_log;
create policy "activity_log_select_if_project_auditor"
on public.activity_log
for select
to authenticated
using (
  public.get_project_role(project_id, auth.uid()) in ('owner', 'manager', 'editor')
);

drop policy if exists "activity_log_insert_if_project_member_actor_matches" on public.activity_log;
create policy "activity_log_insert_if_project_member_actor_matches"
on public.activity_log
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.get_project_role(project_id, auth.uid()) is not null
);
