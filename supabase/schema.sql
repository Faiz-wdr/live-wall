-- Supabase Schema for LiveWall (Refactored)

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  device_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Allow public inserts on profiles" on public.profiles
  for insert with check (true);

create policy "Allow select on profiles" on public.profiles
  for select using (true);


-- POSTS TABLE
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  message text,
  image_url text,
  post_type text check (post_type in ('user', 'announcement')) default 'user' not null,
  status text check (status in ('active', 'hidden', 'deleted')) default 'active' not null,
  likes_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for posts
alter table public.posts enable row level security;

-- Policies for posts
create policy "Allow public read access to active posts" on public.posts
  for select using (status = 'active');

create policy "Allow public to insert posts" on public.posts
  for insert with check (true);

-- Allow service role (bypasses RLS anyway, but keep for explicit schema definition)
create policy "Allow service_role full control on posts" on public.posts
  for all using (true) with check (true);


-- SETTINGS TABLE
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for settings
alter table public.settings enable row level security;

-- Policies for settings
create policy "Allow read access to settings for everyone" on public.settings
  for select using (true);

create policy "Allow service_role full control on settings" on public.settings
  for all using (true) with check (true);


-- DATABASE FUNCTION: Safe Likes Increment
create or replace function public.increment_likes(post_id uuid)
returns void as $$
begin
  update public.posts
  set likes_count = likes_count + 1
  where id = post_id;
end;
$$ language plpgsql security definer;

-- INSERT DEFAULT SETTINGS
insert into public.settings (key, value) values
  ('post_expiry_duration', '60'), -- in minutes
  ('max_image_size', '5'),         -- in MB
  ('enable_moderation', 'false')
on conflict (key) do nothing;


-- Realtime setup: Add posts to the supabase_realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.posts;
commit;
