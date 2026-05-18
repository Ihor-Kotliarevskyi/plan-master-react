-- Plan Master clone - initial Supabase schema
-- Target: fresh Supabase project for this repository
-- Date: 2026-05-17
--
-- Notes:
-- 1. This schema is aligned with the current frontend contract in js/supabase-api.js.
-- 2. Project roles use owner/manager/editor/viewer.
-- 3. Editors are temporarily allowed to UPDATE projects because the current client
--    sync path updates project metadata together with task changes in apiSyncProject().
--    After separating task sync from project settings sync, narrow that policy.

create extension if not exists pgcrypto;

-- Keep privileged helpers out of the exposed public schema where possible.
create schema if not exists private;

-- ============================================================================
-- PROFILES
-- ============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'user' check (role in ('guest', 'user', 'admin')),
  avatar      text,
  theme       text default 'light' check (theme in ('light', 'dark')),
  default_sm  smallint default 0,
  default_sy  integer default 2025,
  default_nm  smallint default 12 check (default_nm between 3 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);

-- ============================================================================
-- PROJECTS
-- ============================================================================

create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  sm             smallint default 0,
  sy             integer default 2025,
  nm             smallint default 12 check (nm between 3 and 120),
  cats           jsonb not null default '[]'::jsonb,
  next_n         integer not null default 1,
  baseline       jsonb default null,
  baseline_date  text default null,
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists projects_updated_idx on public.projects(updated_at desc);

-- ============================================================================
-- PROJECT SHARES
-- ============================================================================

create table if not exists public.project_shares (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'viewer' check (role in ('viewer', 'editor', 'manager')),
  invited_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists shares_project_idx on public.project_shares(project_id);
create index if not exists shares_user_idx on public.project_shares(user_id);

-- ============================================================================
-- TASKS
-- ============================================================================

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  n           integer not null,
  "order"     integer not null default 0,
  name        text not null,
  cat         smallint default 0,
  ms          smallint default 0,
  ws          smallint default 0,
  me          smallint default 1,
  we          smallint default 3,
  prog        smallint default 0 check (prog between 0 and 100),
  budget      numeric(15,2) default 0,
  spent       numeric(15,2) default 0,
  deps        jsonb not null default '[]'::jsonb,
  phases      jsonb default null,
  cost_items  jsonb default null,
  notes       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, n)
);

create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists tasks_order_idx on public.tasks(project_id, "order");

-- ============================================================================
-- GRANTS
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to service_role;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_shares to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.projects to service_role;
grant select, insert, update, delete on public.project_shares to service_role;
grant select, insert, update, delete on public.tasks to service_role;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_shares enable row level security;
alter table public.tasks enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles
  for select
  using (
    auth.uid() is not null
    and auth.uid() = id
  );

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() is not null and auth.uid() = id)
  with check (auth.uid() is not null and auth.uid() = id);

-- Projects
create policy "projects_select_if_owner_or_shared"
  on public.projects
  for select
  using (
    auth.uid() is not null
    and (
      owner_id = auth.uid()
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = projects.id
          and s.user_id = auth.uid()
      )
    )
  );

create policy "projects_insert_own"
  on public.projects
  for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy "projects_update_if_owner_or_project_editor"
  on public.projects
  for update
  using (
    auth.uid() is not null
    and (
      owner_id = auth.uid()
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = projects.id
          and s.user_id = auth.uid()
          and s.role in ('editor', 'manager')
      )
    )
  )
  with check (
    auth.uid() is not null
    and (
      owner_id = auth.uid()
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = projects.id
          and s.user_id = auth.uid()
          and s.role in ('editor', 'manager')
      )
    )
  );

create policy "projects_delete_own"
  on public.projects
  for delete
  using (auth.uid() is not null and owner_id = auth.uid());

-- Project shares
create policy "shares_select_if_owner_manager_or_self"
  on public.project_shares
  for select
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.projects p
        where p.id = project_shares.project_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = project_shares.project_id
          and s.user_id = auth.uid()
          and s.role = 'manager'
      )
    )
  );

create policy "shares_insert_if_owner_or_manager"
  on public.project_shares
  for insert
  with check (
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = project_id
          and s.user_id = auth.uid()
          and s.role = 'manager'
      )
    )
  );

create policy "shares_update_if_owner_or_manager"
  on public.project_shares
  for update
  using (
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.projects p
        where p.id = project_shares.project_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = project_shares.project_id
          and s.user_id = auth.uid()
          and s.role = 'manager'
      )
    )
  )
  with check (
    auth.uid() is not null
    and role in ('viewer', 'editor', 'manager')
    and (
      exists (
        select 1
        from public.projects p
        where p.id = project_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = project_id
          and s.user_id = auth.uid()
          and s.role = 'manager'
      )
    )
  );

create policy "shares_delete_if_owner_or_manager"
  on public.project_shares
  for delete
  using (
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.projects p
        where p.id = project_shares.project_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.project_shares s
        where s.project_id = project_shares.project_id
          and s.user_id = auth.uid()
          and s.role = 'manager'
      )
    )
  );

-- Tasks
create policy "tasks_select_if_project_access"
  on public.tasks
  for select
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1
            from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
          )
        )
    )
  );

create policy "tasks_insert_if_editor_or_manager"
  on public.tasks
  for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.projects p
      where p.id = project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1
            from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor', 'manager')
          )
        )
    )
  );

create policy "tasks_update_if_editor_or_manager"
  on public.tasks
  for update
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1
            from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor', 'manager')
          )
        )
    )
  )
  with check (
    auth.uid() is not null
    and exists (
      select 1
      from public.projects p
      where p.id = project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1
            from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor', 'manager')
          )
        )
    )
  );

create policy "tasks_delete_if_editor_or_manager"
  on public.tasks
  for delete
  using (
    auth.uid() is not null
    and exists (
      select 1
      from public.projects p
      where p.id = tasks.project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1
            from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor', 'manager')
          )
        )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.touch_updated_at();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row
  execute procedure public.touch_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row
  execute procedure public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

create or replace function public.get_project_role(p_project_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
as $$
  select
    case
      when p.owner_id = p_user_id then 'owner'
      when s.role is not null then s.role
      else null
    end
  from public.projects p
  left join public.project_shares s
    on s.project_id = p.id
   and s.user_id = p_user_id
  where p.id = p_project_id
  limit 1;
$$;

-- Compatibility helper for the current client-side share flow.
-- Later this should move behind a server-side invite flow or Edge Function.
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1;
$$;

create or replace function public.upsert_tasks(
  p_project_id uuid,
  p_tasks jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  t jsonb;
  upserted integer := 0;
  ns_to_keep integer[];
begin
  select array_agg((el->>'n')::integer)
    into ns_to_keep
  from jsonb_array_elements(p_tasks) el;

  for t in select * from jsonb_array_elements(p_tasks) loop
    insert into public.tasks (
      project_id, n, "order", name, cat, ms, ws, me, we, prog,
      budget, spent, deps, phases, cost_items, notes
    ) values (
      p_project_id,
      (t->>'n')::integer,
      coalesce((t->>'order')::integer, 0),
      t->>'name',
      coalesce((t->>'cat')::smallint, 0),
      coalesce((t->>'ms')::smallint, 0),
      coalesce((t->>'ws')::smallint, 0),
      coalesce((t->>'me')::smallint, 1),
      coalesce((t->>'we')::smallint, 3),
      coalesce((t->>'prog')::smallint, 0),
      coalesce((t->>'budget')::numeric, 0),
      coalesce((t->>'spent')::numeric, 0),
      coalesce(t->'deps', '[]'::jsonb),
      t->'phases',
      t->'costItems',
      coalesce(t->'notes', '[]'::jsonb)
    )
    on conflict (project_id, n) do update
      set "order" = excluded."order",
          name = excluded.name,
          cat = excluded.cat,
          ms = excluded.ms,
          ws = excluded.ws,
          me = excluded.me,
          we = excluded.we,
          prog = excluded.prog,
          budget = excluded.budget,
          spent = excluded.spent,
          deps = excluded.deps,
          phases = excluded.phases,
          cost_items = excluded.cost_items,
          notes = excluded.notes,
          updated_at = now();

    upserted := upserted + 1;
  end loop;

  if ns_to_keep is not null then
    delete from public.tasks
    where project_id = p_project_id
      and n != all(ns_to_keep);
  end if;

  return upserted;
end;
$$;

grant execute on function public.get_project_role(uuid, uuid) to authenticated, service_role;
grant execute on function public.get_user_id_by_email(text) to authenticated, service_role;
grant execute on function public.upsert_tasks(uuid, jsonb) to authenticated, service_role;
