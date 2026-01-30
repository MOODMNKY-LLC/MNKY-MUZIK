/*
 * Initial schema for Spotify clone app.
 * Tables: users, products, prices, customers, songs, liked_songs, subscriptions.
 * Enums: pricing_plan_interval, pricing_type, subscription_status.
 */

-- Enums for Stripe / subscription data
create type public.pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create type public.pricing_type as enum ('one_time', 'recurring');
create type public.subscription_status as enum (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid'
);

-- User profiles / billing (synced with auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  billing_address jsonb,
  full_name text,
  payment_method jsonb
);
comment on table public.users is 'App user profiles and billing; id matches auth.users.';

alter table public.users enable row level security;

create policy "users_select_anon"
  on public.users for select
  to anon
  using (true);

create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

create policy "users_insert_authenticated"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users_update_authenticated"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Stripe products (read-only from app)
create table public.products (
  id text primary key,
  active boolean,
  description text,
  image text,
  metadata jsonb,
  name text
);
comment on table public.products is 'Stripe products; synced via webhook.';

alter table public.products enable row level security;

create policy "products_select_anon"
  on public.products for select
  to anon
  using (true);

create policy "products_select_authenticated"
  on public.products for select
  to authenticated
  using (true);

-- Stripe prices (read-only from app)
create table public.prices (
  id text primary key,
  active boolean,
  currency text,
  description text,
  interval public.pricing_plan_interval,
  interval_count integer,
  metadata jsonb,
  product_id text references public.products (id) on delete cascade,
  trial_period_days integer,
  type public.pricing_type,
  unit_amount bigint
);
comment on table public.prices is 'Stripe prices; synced via webhook.';

alter table public.prices enable row level security;

create policy "prices_select_anon"
  on public.prices for select
  to anon
  using (true);

create policy "prices_select_authenticated"
  on public.prices for select
  to authenticated
  using (true);

-- Stripe customer id per user
create table public.customers (
  id uuid primary key references public.users (id) on delete cascade,
  stripe_customer_id text
);
comment on table public.customers is 'Stripe customer id per user.';

alter table public.customers enable row level security;

create policy "customers_select_authenticated"
  on public.customers for select
  to authenticated
  using (auth.uid() = id);

create policy "customers_insert_authenticated"
  on public.customers for insert
  to authenticated
  with check (auth.uid() = id);

create policy "customers_update_authenticated"
  on public.customers for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Songs (user-uploaded)
create table public.songs (
  id bigint generated always as identity primary key,
  author text,
  created_at timestamptz default now(),
  image_path text,
  song_path text,
  title text,
  user_id uuid references public.users (id) on delete cascade
);
comment on table public.songs is 'User-uploaded songs.';

alter table public.songs enable row level security;

create policy "songs_select_anon"
  on public.songs for select
  to anon
  using (true);

create policy "songs_select_authenticated"
  on public.songs for select
  to authenticated
  using (true);

create policy "songs_insert_authenticated"
  on public.songs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "songs_update_authenticated"
  on public.songs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "songs_delete_authenticated"
  on public.songs for delete
  to authenticated
  using (auth.uid() = user_id);

-- Liked songs (user <-> song)
create table public.liked_songs (
  created_at timestamptz default now(),
  song_id bigint not null references public.songs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  primary key (user_id, song_id)
);
comment on table public.liked_songs is 'User likes for songs.';

alter table public.liked_songs enable row level security;

create policy "liked_songs_select_authenticated"
  on public.liked_songs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "liked_songs_insert_authenticated"
  on public.liked_songs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "liked_songs_delete_authenticated"
  on public.liked_songs for delete
  to authenticated
  using (auth.uid() = user_id);

-- Stripe subscriptions (synced via webhook)
create table public.subscriptions (
  id text primary key,
  cancel_at timestamptz,
  cancel_at_period_end boolean,
  canceled_at timestamptz,
  created timestamptz not null default now(),
  current_period_end timestamptz not null,
  current_period_start timestamptz not null,
  ended_at timestamptz,
  metadata jsonb,
  price_id text references public.prices (id) on delete set null,
  quantity integer,
  status public.subscription_status,
  trial_end timestamptz,
  trial_start timestamptz,
  user_id uuid not null references public.users (id) on delete cascade
);
comment on table public.subscriptions is 'Stripe subscriptions; synced via webhook.';

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_authenticated"
  on public.subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "subscriptions_insert_authenticated"
  on public.subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "subscriptions_update_authenticated"
  on public.subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: create public.users row when auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, users.full_name),
    avatar_url = coalesce(excluded.avatar_url, users.avatar_url);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
