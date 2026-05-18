-- Access metadata helpers for shared project UX.
-- Exposes owner/inviter profile data through security definer RPCs,
-- while keeping direct profiles RLS strict.

create or replace function public.list_accessible_projects()
returns table (
  project_id uuid,
  name text,
  sm smallint,
  sy integer,
  nm smallint,
  is_archived boolean,
  updated_at timestamptz,
  role text,
  source text,
  owner_id uuid,
  owner_name text,
  owner_email text,
  invited_by uuid,
  invited_by_name text,
  invited_by_email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as project_id,
    p.name,
    p.sm,
    p.sy,
    p.nm,
    p.is_archived,
    p.updated_at,
    'owner'::text as role,
    'own'::text as source,
    p.owner_id,
    owner_profile.name as owner_name,
    owner_profile.email as owner_email,
    null::uuid as invited_by,
    null::text as invited_by_name,
    null::text as invited_by_email
  from public.projects p
  join public.profiles owner_profile on owner_profile.id = p.owner_id
  where p.owner_id = auth.uid()
    and p.is_archived = false

  union all

  select
    p.id as project_id,
    p.name,
    p.sm,
    p.sy,
    p.nm,
    p.is_archived,
    p.updated_at,
    s.role,
    'shared'::text as source,
    p.owner_id,
    owner_profile.name as owner_name,
    owner_profile.email as owner_email,
    s.invited_by,
    inviter_profile.name as invited_by_name,
    inviter_profile.email as invited_by_email
  from public.project_shares s
  join public.projects p on p.id = s.project_id
  join public.profiles owner_profile on owner_profile.id = p.owner_id
  left join public.profiles inviter_profile on inviter_profile.id = s.invited_by
  where s.user_id = auth.uid()
    and p.is_archived = false;
$$;

grant execute on function public.list_accessible_projects() to authenticated, service_role;

create or replace function public.list_project_shares(p_project_id uuid)
returns table (
  id uuid,
  role text,
  user_id uuid,
  user_name text,
  user_email text,
  invited_by uuid,
  invited_by_name text,
  invited_by_email text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.role,
    s.user_id,
    member_profile.name as user_name,
    member_profile.email as user_email,
    s.invited_by,
    inviter_profile.name as invited_by_name,
    inviter_profile.email as invited_by_email,
    s.created_at
  from public.project_shares s
  join public.profiles member_profile on member_profile.id = s.user_id
  left join public.profiles inviter_profile on inviter_profile.id = s.invited_by
  where s.project_id = p_project_id
    and public.get_project_role(p_project_id, auth.uid()) in ('owner', 'manager')
  order by s.created_at asc;
$$;

grant execute on function public.list_project_shares(uuid) to authenticated, service_role;
