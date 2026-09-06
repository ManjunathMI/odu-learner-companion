-- ═══════════════════════════════════════════════════════════════
-- PHASE 1 SCHEMA — Multi-Path Learning Platform
-- Run this in Supabase's SQL Editor, in order, top to bottom.
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensions ───
create extension if not exists "uuid-ossp";

-- ─── Core tables ───

create table learning_paths (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  tags text[],
  created_by uuid not null references auth.users(id),
  visibility text not null default 'private' check (visibility in ('public','private')),
  wall_status text not null default 'pending_review' check (wall_status in ('pending_review','approved','rejected','unlisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table path_memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  path_id uuid not null references learning_paths(id) on delete cascade,
  role text not null default 'learner' check (role in ('admin','moderator','learner')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  joined_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (user_id, path_id)
);

create table platform_admins (
  user_id uuid primary key references auth.users(id)
);

create table profiles (
  user_id uuid primary key references auth.users(id),
  display_name text not null,
  avatar_url text,
  bio text,
  social_links jsonb default '{}',
  repo_links jsonb default '{}',
  profile_visibility text not null default 'joined_paths_only' check (profile_visibility in ('joined_paths_only','public')),
  updated_at timestamptz not null default now()
);

-- ─── Path content (replaces v1's static JSON) ───

create table phases (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid not null references learning_paths(id) on delete cascade,
  title text not null,
  goal text,
  sort_order int not null default 0
);

create table days (
  id uuid primary key default uuid_generate_v4(),
  phase_id uuid not null references phases(id) on delete cascade,
  day_label text not null,
  title text not null,
  hours text,
  sort_order int not null default 0
);

create table lesson_items (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid not null references days(id) on delete cascade,
  title text not null,
  url text not null,
  tag text check (tag in ('hands','exam') or tag is null),
  sort_order int not null default 0
);

-- ─── Learner activity ───

create table progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  path_id uuid not null references learning_paths(id) on delete cascade,
  item_key uuid not null references lesson_items(id) on delete cascade,
  done boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, item_key)
);

create table notes (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid not null references learning_paths(id) on delete cascade,
  item_key uuid not null references lesson_items(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  note_text text not null,
  created_at timestamptz not null default now()
);

create table feedback (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid references learning_paths(id) on delete cascade,
  user_id uuid references auth.users(id),
  message text not null,
  created_at timestamptz not null default now()
);

-- ─── Badges (Phase 4 tables, created now so the schema is stable) ───

create table badge_definitions (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid references learning_paths(id) on delete cascade, -- null = platform-wide badge
  name text not null,
  description text,
  icon text,
  criteria_type text not null check (criteria_type in ('automatic','manual')),
  automatic_rule jsonb
);

create table badge_awards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  badge_id uuid not null references badge_definitions(id) on delete cascade,
  awarded_by uuid references auth.users(id), -- null = system-awarded
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- ═══════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- Centralize role-lookup logic so RLS policies stay simple and
-- consistent rather than repeating the same subquery everywhere.
-- ═══════════════════════════════════════════════════════════════

-- Returns the caller's role on a given path, or null if they have
-- no approved membership.
create or replace function get_role(p_path_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from path_memberships
  where path_id = p_path_id
    and user_id = auth.uid()
    and status = 'approved'
  limit 1;
$$;

-- True if the caller is admin or moderator on this path.
create or replace function is_moderator_or_above(p_path_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from path_memberships
    where path_id = p_path_id
      and user_id = auth.uid()
      and status = 'approved'
      and role in ('admin','moderator')
  );
$$;

-- True if the caller is admin on this path.
create or replace function is_path_admin(p_path_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from path_memberships
    where path_id = p_path_id
      and user_id = auth.uid()
      and status = 'approved'
      and role = 'admin'
  );
$$;

-- True if the caller has any approved membership on this path
-- (any role — admin, moderator, or learner).
create or replace function is_approved_member(p_path_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from path_memberships
    where path_id = p_path_id
      and user_id = auth.uid()
      and status = 'approved'
  );
$$;

-- True if the caller is a platform admin.
create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(select 1 from platform_admins where user_id = auth.uid());
$$;

-- True if the given path is publicly visible.
create or replace function path_is_public(p_path_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select visibility = 'public' from learning_paths where id = p_path_id;
$$;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table learning_paths enable row level security;
alter table path_memberships enable row level security;
alter table platform_admins enable row level security;
alter table profiles enable row level security;
alter table phases enable row level security;
alter table days enable row level security;
alter table lesson_items enable row level security;
alter table progress enable row level security;
alter table notes enable row level security;
alter table feedback enable row level security;
alter table badge_definitions enable row level security;
alter table badge_awards enable row level security;

-- ── learning_paths ──
-- Anyone can see a path if it's public OR they're an approved member.
-- Anyone signed in can create a path (becomes admin via a trigger, see below).
-- Only the path's admin can update it.
create policy "read public or member paths" on learning_paths
  for select using (
    visibility = 'public' or is_approved_member(id)
  );

create policy "any signed-in user can create a path" on learning_paths
  for insert with check (auth.uid() = created_by);

create policy "path admin can update their path" on learning_paths
  for update using (is_path_admin(id));

-- ── path_memberships ──
-- Members can see the membership list of paths they belong to.
-- Anyone signed in can insert their own pending request.
-- Only moderators+ can update (approve/reject/promote) rows on their path.
create policy "members see memberships on their paths" on path_memberships
  for select using (
    user_id = auth.uid() or is_approved_member(path_id)
  );

create policy "signed-in user requests to join" on path_memberships
  for insert with check (
    user_id = auth.uid() and status = 'pending'
  );

create policy "moderators manage memberships on their path" on path_memberships
  for update using (is_moderator_or_above(path_id));

-- ── platform_admins ──
-- No public read or write. Only touched via Supabase service role
-- (i.e. manually by you, or a trusted server-side action).
-- No policies created = no access via anon/authenticated roles at all.

-- ── profiles ──
-- Visible to the owner always; visible to others if public, or if
-- they share an approved path membership with the profile owner.
create policy "profile visible per visibility rule" on profiles
  for select using (
    user_id = auth.uid()
    or profile_visibility = 'public'
    or exists (
      select 1 from path_memberships pm1
      join path_memberships pm2 on pm1.path_id = pm2.path_id
      where pm1.user_id = profiles.user_id
        and pm2.user_id = auth.uid()
        and pm1.status = 'approved'
        and pm2.status = 'approved'
    )
  );

create policy "user manages own profile" on profiles
  for all using (user_id = auth.uid());

-- ── phases / days / lesson_items ──
-- Readable under the same rule as their parent path.
-- Writable only by that path's admin.
create policy "read phases if path readable" on phases
  for select using (
    path_is_public(path_id) or is_approved_member(path_id)
  );
create policy "path admin manages phases" on phases
  for all using (is_path_admin(path_id));

create policy "read days if path readable" on days
  for select using (
    exists (select 1 from phases where phases.id = days.phase_id
      and (path_is_public(phases.path_id) or is_approved_member(phases.path_id)))
  );
create policy "path admin manages days" on days
  for all using (
    exists (select 1 from phases where phases.id = days.phase_id and is_path_admin(phases.path_id))
  );

create policy "read items if path readable" on lesson_items
  for select using (
    exists (
      select 1 from days join phases on phases.id = days.phase_id
      where days.id = lesson_items.day_id
        and (path_is_public(phases.path_id) or is_approved_member(phases.path_id))
    )
  );
create policy "path admin manages items" on lesson_items
  for all using (
    exists (
      select 1 from days join phases on phases.id = days.phase_id
      where days.id = lesson_items.day_id and is_path_admin(phases.path_id)
    )
  );

-- ── progress ──
-- A learner can see and write only their own progress rows, scoped
-- to paths they're an approved member of. Others on the same path
-- can read (for the leaderboard) if they're also approved members.
create policy "read progress on shared paths" on progress
  for select using (is_approved_member(path_id));

create policy "learner writes own progress" on progress
  for insert with check (user_id = auth.uid() and is_approved_member(path_id));

create policy "learner updates own progress" on progress
  for update using (user_id = auth.uid() and is_approved_member(path_id));

-- ── notes ──
create policy "read notes on shared paths" on notes
  for select using (is_approved_member(path_id));

create policy "member writes notes" on notes
  for insert with check (user_id = auth.uid() and is_approved_member(path_id));

-- ── feedback ──
-- Anyone can submit; only platform admins can read (checked at API
-- layer using the service role — no public select policy at all).
create policy "anyone submits feedback" on feedback
  for insert with check (true);

-- ── badge_definitions ──
create policy "read badges if path readable or platform-wide" on badge_definitions
  for select using (
    path_id is null or path_is_public(path_id) or is_approved_member(path_id)
  );
create policy "path admin manages badge definitions" on badge_definitions
  for all using (path_id is not null and is_path_admin(path_id));

-- ── badge_awards ──
create policy "read badge awards on shared paths" on badge_awards
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from badge_definitions bd
      where bd.id = badge_awards.badge_id
        and (bd.path_id is null or is_approved_member(bd.path_id))
    )
  );
create policy "moderator awards manual badges" on badge_awards
  for insert with check (
    exists (
      select 1 from badge_definitions bd
      where bd.id = badge_awards.badge_id
        and bd.path_id is not null
        and is_moderator_or_above(bd.path_id)
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- When a path is created, automatically insert an approved 'admin'
-- membership row for its creator — this is how "creator becomes
-- admin" is enforced, not left to application code to remember.
create or replace function handle_new_path()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into path_memberships (user_id, path_id, role, status, decided_at)
  values (new.created_by, new.id, 'admin', 'approved', now());
  return new;
end;
$$;

create trigger on_path_created
  after insert on learning_paths
  for each row execute function handle_new_path();

-- ═══════════════════════════════════════════════════════════════
-- GRANTS
-- RLS defines *which rows*; grants define *whether the role can
-- touch the table at all*. Both are required.
-- ═══════════════════════════════════════════════════════════════

grant select, insert, update on learning_paths to authenticated;
grant select, insert, update on path_memberships to authenticated;
grant select, insert, update, delete on profiles to authenticated;
grant select, insert, update, delete on phases to authenticated;
grant select, insert, update, delete on days to authenticated;
grant select, insert, update, delete on lesson_items to authenticated;
grant select, insert, update on progress to authenticated;
grant select, insert on notes to authenticated;
grant insert on feedback to authenticated;
grant select, insert, update, delete on badge_definitions to authenticated;
grant select, insert on badge_awards to authenticated;

grant usage, select on all sequences in schema public to authenticated;
grant execute on function get_role(uuid) to authenticated;
grant execute on function is_moderator_or_above(uuid) to authenticated;
grant execute on function is_path_admin(uuid) to authenticated;
grant execute on function is_approved_member(uuid) to authenticated;
grant execute on function is_platform_admin() to authenticated;
grant execute on function path_is_public(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- ONE-TIME SETUP: make yourself the first platform admin
-- Run this AFTER you've signed up once through the app, so your
-- auth.users row exists. Replace the email with your own.
-- ═══════════════════════════════════════════════════════════════

-- insert into platform_admins (user_id)
-- select id from auth.users where email = 'your-email@example.com';
