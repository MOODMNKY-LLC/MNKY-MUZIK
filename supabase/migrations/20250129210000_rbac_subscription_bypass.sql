/*
 * RBAC and subscription bypass: role (admin/beta/user), beta_until, first user = admin.
 */

-- Add role and optional beta expiry to users
alter table public.users
  add column if not exists role text not null default 'user' check (role in ('admin', 'beta', 'user')),
  add column if not exists beta_until timestamptz;

comment on column public.users.role is 'Access role: admin (full), beta (PIN), user (subscription required).';
comment on column public.users.beta_until is 'When beta access expires; null = no expiry or not beta.';

-- Drop existing trigger and function so we can replace with updated logic
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Recreate: insert profile and set first user as admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'user'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, users.full_name),
    avatar_url = coalesce(excluded.avatar_url, users.avatar_url);

  -- First user becomes admin
  update public.users
  set role = 'admin'
  where id = new.id
    and (select count(*) from public.users) = 1;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Promote existing first user to admin (idempotent for fresh vs existing DBs)
update public.users
set role = 'admin'
where id = (select id from public.users order by id limit 1)
  and role = 'user';
