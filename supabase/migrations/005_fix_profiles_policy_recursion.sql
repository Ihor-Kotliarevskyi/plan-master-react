-- Fix recursive RLS policy on public.profiles.
-- The old policy queried public.profiles from inside a policy on public.profiles,
-- which causes Postgres error 42P17: infinite recursion detected in policy.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() is not null
    and auth.uid() = id
  );
