-- Phase 1 role migration for legacy databases
-- Use this only on databases that still have project_shares.role = admin.

begin;

-- Normalize existing share records first.
update public.project_shares
set role = 'manager'
where role = 'admin';

-- Replace the old check constraint with the Phase 1 role model.
do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'project_shares'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%role%';

  if constraint_name is not null then
    execute format('alter table public.project_shares drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.project_shares
  add constraint project_shares_role_check
  check (role in ('viewer', 'editor', 'manager'));

-- Legacy projects policy: owner or editor/admin could update project rows.
drop policy if exists "projects: update if owner or editor" on public.projects;
create policy "projects: update if owner or editor"
  on public.projects for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_shares s
      where s.project_id = id
        and s.user_id = auth.uid()
        and s.role in ('editor','manager')
    )
  );

-- Legacy shares policies: owner/admin -> owner/manager.
drop policy if exists "shares: manage by project owner" on public.project_shares;
create policy "shares: manage by project owner"
  on public.project_shares for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.project_shares s
      where s.project_id = public.project_shares.project_id
        and s.user_id = auth.uid()
        and s.role = 'manager'
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.project_shares s
      where s.project_id = public.project_shares.project_id
        and s.user_id = auth.uid()
        and s.role = 'manager'
    )
  );

-- Legacy tasks policies: editor/admin -> editor/manager.
drop policy if exists "tasks: insert if editor" on public.tasks;
create policy "tasks: insert if editor"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1 from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor','manager')
          )
        )
    )
  );

drop policy if exists "tasks: update if editor" on public.tasks;
create policy "tasks: update if editor"
  on public.tasks for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1 from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor','manager')
          )
        )
    )
  );

drop policy if exists "tasks: delete if editor" on public.tasks;
create policy "tasks: delete if editor"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1 from public.project_shares s
            where s.project_id = p.id
              and s.user_id = auth.uid()
              and s.role in ('editor','manager')
          )
        )
    )
  );

commit;
