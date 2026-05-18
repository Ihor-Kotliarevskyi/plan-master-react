-- Self-healing helper for users whose auth account exists
-- but public.profiles row was not created by the signup trigger.

create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user auth.users%rowtype;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_user
  from auth.users
  where id = auth.uid();

  if not found then
    raise exception 'Authenticated user not found in auth.users';
  end if;

  insert into public.profiles (id, name, email)
  values (
    v_user.id,
    coalesce(v_user.raw_user_meta_data->>'name', split_part(v_user.email, '@', 1)),
    v_user.email
  )
  on conflict (id) do update
    set name = coalesce(public.profiles.name, excluded.name),
        email = excluded.email
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated, service_role;
