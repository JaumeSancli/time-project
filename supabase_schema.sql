-- Run this in the SQL Editor of your Supabase Dashboard

-- 1. Create Dedicated Schema
create schema if not exists timeflow;

-- Grant usage on schema to generic roles
grant usage on schema timeflow to postgres, anon, authenticated, service_role;
grant all on all tables in schema timeflow to postgres, anon, authenticated, service_role;
grant all on all routines in schema timeflow to postgres, anon, authenticated, service_role;
grant all on all sequences in schema timeflow to postgres, anon, authenticated, service_role;

alter default privileges in schema timeflow grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema timeflow grant all on routines to postgres, anon, authenticated, service_role;
alter default privileges in schema timeflow grant all on sequences to postgres, anon, authenticated, service_role;

-- 2. PROFILES Table (Extends auth.users but lives in timeflow schema)
create table timeflow.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

alter table timeflow.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on timeflow.profiles
  for select using (true);

create policy "Users can insert their own profile." on timeflow.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on timeflow.profiles
  for update using (auth.uid() = id);

-- Trigger to create profile must be in public to be called by auth trigger, 
-- but inserts into timeflow.profiles
create or replace function public.handle_new_timeflow_user()
returns trigger as $$
begin
  insert into timeflow.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition stays on auth.users
-- Note: If you already have a trigger on auth.users for another app, this is fine,
-- multiple triggers can exist.
drop trigger if exists on_auth_user_created_timeflow on auth.users;
create trigger on_auth_user_created_timeflow
  after insert on auth.users
  for each row execute procedure public.handle_new_timeflow_user();


-- 3. CLIENTS Table
create table timeflow.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table timeflow.clients enable row level security;

create policy "Users can view their own clients." on timeflow.clients
  for select using (auth.uid() = user_id);

create policy "Users can insert their own clients." on timeflow.clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own clients." on timeflow.clients
  for update using (auth.uid() = user_id);

create policy "Users can delete their own clients." on timeflow.clients
  for delete using (auth.uid() = user_id);


-- 4. PROJECTS Table
create table timeflow.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  client_id uuid references timeflow.clients not null,
  name text not null,
  color text default '#1677ff',
  is_shared boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table timeflow.projects enable row level security;

create policy "Users can view their own or shared projects." on timeflow.projects
  for select using (auth.uid() = user_id or is_shared = true);

create policy "Users can insert their own projects." on timeflow.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects." on timeflow.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects." on timeflow.projects
  for delete using (auth.uid() = user_id);


-- 5. TIME_ENTRIES Table
create table timeflow.time_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  project_id uuid references timeflow.projects not null,
  description text,
  start_time bigint not null, 
  end_time bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table timeflow.time_entries enable row level security;

create policy "Users can view their own entries." on timeflow.time_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own entries." on timeflow.time_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own entries." on timeflow.time_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own entries." on timeflow.time_entries
  for delete using (auth.uid() = user_id);


-- 6. TASKS Table
create table timeflow.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references timeflow.projects not null,
  title text not null,
  description text,
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  assigned_to uuid references auth.users,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table timeflow.tasks enable row level security;

create policy "Users can view all tasks." on timeflow.tasks
  for select using (true);

create policy "Users can insert tasks." on timeflow.tasks
  for insert with check (auth.uid() = created_by);

create policy "Users can update tasks." on timeflow.tasks
  for update using (true); 

create policy "Users can delete their own tasks." on timeflow.tasks
  for delete using (auth.uid() = created_by);

-- 7. Update TIME_ENTRIES for Tasks
alter table timeflow.time_entries 
add column task_id uuid references timeflow.tasks;
