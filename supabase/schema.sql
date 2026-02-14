-- Orange Studios (v1) - multi-client workspaces + projects + deliverables
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- Enums
DO $$ BEGIN
  create type public.user_role as enum ('PRODUCER','OPERATOR','REVIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.deliverable_type as enum ('REEL','MICRO_DRAMA','SHORT','LONG_FORM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.shot_status as enum ('BACKLOG','GENERATE','REVIEW','FIX','APPROVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.take_status as enum ('PENDING','APPROVED','REJECTED','NEEDS_FIX');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.sequence_status as enum ('ASSEMBLING','REVIEW','LOCKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create type public.review_verdict as enum ('APPROVED','REJECTED','NEEDS_FIX');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Workspaces = Clients
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_bible jsonb not null default '{}'::jsonb,
  drive_client_folder_id text,
  created_at timestamptz not null default now()
);
create unique index if not exists workspaces_name_uq on public.workspaces(name);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Memberships (role per workspace)
create table if not exists public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null default 'PRODUCER',
  created_at timestamptz not null default now(),
  primary key (workspace_id, profile_id)
);
create index if not exists workspace_memberships_profile_idx on public.workspace_memberships(profile_id);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  objective text,
  constraints jsonb not null default '{}'::jsonb,
  start_date date,
  due_date date,
  status text not null default 'ACTIVE',
  drive_project_folder_id text,
  created_at timestamptz not null default now()
);
create index if not exists projects_workspace_idx on public.projects(workspace_id);

-- Deliverables
create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type public.deliverable_type not null,
  platform text,
  aspect_ratio text,
  duration_target_sec int,
  due_date date,
  status text not null default 'PLANNED',
  drive_deliverable_folder_id text,
  created_at timestamptz not null default now()
);
create index if not exists deliverables_project_idx on public.deliverables(project_id);

-- Sequences
create table if not exists public.sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  name text not null,
  "order" int not null default 0,
  status public.sequence_status not null default 'ASSEMBLING',
  created_at timestamptz not null default now()
);
create index if not exists sequences_deliverable_idx on public.sequences(deliverable_id);

-- Shots
create table if not exists public.shots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  sequence_id uuid references public.sequences(id) on delete set null,
  intent text,
  duration_sec int,
  shot_spec jsonb not null default '{}'::jsonb,
  status public.shot_status not null default 'BACKLOG',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shots_deliverable_idx on public.shots(deliverable_id);

-- Tool profiles (configurable tool presets)
create table if not exists public.tool_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  tool_name text not null,
  tool_type text not null,
  default_settings jsonb not null default '{}'::jsonb,
  settings_schema jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Takes (Drive-backed)
create table if not exists public.takes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shot_id uuid not null references public.shots(id) on delete cascade,
  tool_profile_id uuid references public.tool_profiles(id) on delete set null,
  prompt_pack_id uuid,
  drive_file_id text,
  drive_links jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status public.take_status not null default 'PENDING',
  created_at timestamptz not null default now()
);
create index if not exists takes_shot_idx on public.takes(shot_id);

-- Reviews
create table if not exists public.take_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  take_id uuid not null references public.takes(id) on delete cascade,
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  verdict public.review_verdict not null,
  reason_codes text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sequence_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  verdict public.review_verdict not null,
  notes text,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DO $$ BEGIN
  create trigger shots_set_updated_at
  before update on public.shots
  for each row execute procedure public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- RLS
alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.deliverables enable row level security;
alter table public.sequences enable row level security;
alter table public.shots enable row level security;
alter table public.takes enable row level security;
alter table public.take_reviews enable row level security;
alter table public.sequence_reviews enable row level security;
alter table public.tool_profiles enable row level security;

-- Helpers
create or replace function public.has_workspace_access(ws uuid)
returns boolean as $$
  select exists(
    select 1 from public.workspace_memberships m
    where m.workspace_id = ws and m.profile_id = auth.uid()
  );
$$ language sql stable security definer;

-- Policies
DO $$ BEGIN
  create policy "workspaces: members can read" on public.workspaces
  for select to authenticated
  using (public.has_workspace_access(id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "workspaces: producer can write" on public.workspaces
  for update to authenticated
  using (
    exists(
      select 1 from public.workspace_memberships m
      where m.workspace_id = id and m.profile_id = auth.uid() and m.role = 'PRODUCER'
    )
  )
  with check (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "profiles: read self" on public.profiles
  for select to authenticated
  using (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "profiles: insert self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "memberships: read own" on public.workspace_memberships
  for select to authenticated
  using (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Workspace-scoped read/write policies (simple: any member can read; producer/operator can write; reviewer writes reviews)
DO $$ BEGIN
  create policy "projects: member read" on public.projects
  for select to authenticated
  using (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "projects: producer write" on public.projects
  for all to authenticated
  using (
    exists(select 1 from public.workspace_memberships m where m.workspace_id = workspace_id and m.profile_id = auth.uid() and m.role = 'PRODUCER')
  )
  with check (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "deliverables: member read" on public.deliverables
  for select to authenticated
  using (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "deliverables: producer write" on public.deliverables
  for all to authenticated
  using (
    exists(select 1 from public.workspace_memberships m where m.workspace_id = workspace_id and m.profile_id = auth.uid() and m.role = 'PRODUCER')
  )
  with check (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "shots: member read" on public.shots
  for select to authenticated
  using (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "shots: producer+operator write" on public.shots
  for all to authenticated
  using (
    exists(select 1 from public.workspace_memberships m where m.workspace_id = workspace_id and m.profile_id = auth.uid() and m.role in ('PRODUCER','OPERATOR'))
  )
  with check (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "takes: member read" on public.takes
  for select to authenticated
  using (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "takes: producer+operator write" on public.takes
  for all to authenticated
  using (
    exists(select 1 from public.workspace_memberships m where m.workspace_id = workspace_id and m.profile_id = auth.uid() and m.role in ('PRODUCER','OPERATOR'))
  )
  with check (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "take_reviews: member read" on public.take_reviews
  for select to authenticated
  using (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "take_reviews: reviewer write" on public.take_reviews
  for insert to authenticated
  with check (
    exists(select 1 from public.workspace_memberships m where m.workspace_id = workspace_id and m.profile_id = auth.uid() and m.role = 'REVIEWER')
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "sequence_reviews: member read" on public.sequence_reviews
  for select to authenticated
  using (public.has_workspace_access(workspace_id));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  create policy "sequence_reviews: reviewer write" on public.sequence_reviews
  for insert to authenticated
  with check (
    exists(select 1 from public.workspace_memberships m where m.workspace_id = workspace_id and m.profile_id = auth.uid() and m.role = 'REVIEWER')
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
