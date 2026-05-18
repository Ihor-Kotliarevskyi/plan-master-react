-- Fix mutual RLS recursion between public.projects and public.project_shares.
-- Old policies queried each other directly:
--   projects -> project_shares
--   project_shares -> projects
-- which causes Postgres policy recursion / 500 errors in PostgREST.

drop policy if exists "projects_select_if_owner_or_shared" on public.projects;
drop policy if exists "projects_update_if_owner_or_project_editor" on public.projects;

create policy "projects_select_if_owner_or_shared"
  on public.projects
  for select
  to authenticated
  using (
    auth.uid() is not null
    and public.get_project_role(id, auth.uid()) is not null
  );

create policy "projects_update_if_owner_or_project_editor"
  on public.projects
  for update
  to authenticated
  using (
    auth.uid() is not null
    and public.get_project_role(id, auth.uid()) in ('owner', 'editor', 'manager')
  )
  with check (
    auth.uid() is not null
    and public.get_project_role(id, auth.uid()) in ('owner', 'editor', 'manager')
  );

drop policy if exists "shares_select_if_owner_manager_or_self" on public.project_shares;
drop policy if exists "shares_insert_if_owner_or_manager" on public.project_shares;
drop policy if exists "shares_update_if_owner_or_manager" on public.project_shares;
drop policy if exists "shares_delete_if_owner_or_manager" on public.project_shares;

create policy "shares_select_if_owner_manager_or_self"
  on public.project_shares
  for select
  to authenticated
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or public.get_project_role(project_id, auth.uid()) in ('owner', 'manager')
    )
  );

create policy "shares_insert_if_owner_or_manager"
  on public.project_shares
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and role in ('viewer', 'editor', 'manager')
    and public.get_project_role(project_id, auth.uid()) in ('owner', 'manager')
  );

create policy "shares_update_if_owner_or_manager"
  on public.project_shares
  for update
  to authenticated
  using (
    auth.uid() is not null
    and public.get_project_role(project_shares.project_id, auth.uid()) in ('owner', 'manager')
  )
  with check (
    auth.uid() is not null
    and role in ('viewer', 'editor', 'manager')
    and public.get_project_role(project_id, auth.uid()) in ('owner', 'manager')
  );

create policy "shares_delete_if_owner_or_manager"
  on public.project_shares
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and public.get_project_role(project_shares.project_id, auth.uid()) in ('owner', 'manager')
  );
