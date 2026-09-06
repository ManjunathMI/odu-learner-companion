# Database Operations

This file records the SQL operations used during local setup and testing. It intentionally contains no credentials or service-role keys.

## Canonical Schema

For a new database, run the canonical `DB-schema.sql` in this repository from top to bottom. Do not run the deleted legacy single-room schema.

The canonical schema creates:

- `learning_paths`
- `path_memberships`
- `platform_admins`
- `profiles`
- `phases`
- `days`
- `lesson_items`
- `progress`
- `notes`
- `feedback`
- `badge_definitions`
- `badge_awards`
- `user_entitlements`
- `quota_requests`
- RLS policies, helper functions, grants, and the creator-admin trigger

For an existing database with data, do not rerun the full schema. Apply the additive statements for `user_entitlements`, `quota_requests`, the path-admin delete policy, and the `create_learning_path_with_entitlement` and `review_quota_request` functions. The application depends on those objects for account capacity, path deletion, and quota review.

## Creator Entitlements and Quota Requests

Creator usage is derived from current ownership rather than a mutable counter:

```sql
select count(*) as created_paths
from learning_paths
where created_by = 'YOUR-USER-ID';
```

The current limit is stored in `user_entitlements.max_created_paths`. Joining another user's path does not consume creator capacity. The creation RPC locks per user, checks the entitlement and current path count, inserts the path, and leaves the existing creator-admin trigger responsible for the approved admin membership.

Backfill or inspect entitlement rows:

```sql
insert into user_entitlements (user_id)
select id from auth.users
on conflict (user_id) do nothing;

select user_id, max_created_paths, updated_at, updated_by
from user_entitlements
order by updated_at desc;
```

Inspect quota requests:

```sql
select
  qr.id,
  qr.user_id,
  p.display_name,
  qr.current_limit,
  qr.requested_limit,
  qr.reason,
  qr.status,
  qr.created_at,
  qr.reviewed_at,
  qr.reviewed_by
from quota_requests qr
left join profiles p on p.user_id = qr.user_id
order by qr.created_at desc;
```

Only one pending request per user is allowed. Platform Admin approval uses `review_quota_request`, which updates the entitlement and records the reviewer and timestamp in the request audit trail.

## Existing Database Migration Checklist

When the application code is deployed against an existing Supabase project, verify these objects have been applied before testing `/account`:

1. `user_entitlements` table, RLS policies, and authenticated select grant.
2. `quota_requests` table, pending-request unique index, RLS policies, and authenticated grants.
3. `learning_paths` delete policy and authenticated delete grant.
4. `create_learning_path_with_entitlement` function and authenticated execute grant.
5. `review_quota_request` function and authenticated execute grant.

The application does not store `created_path_count`; deleting an owned path automatically restores capacity because usage is recalculated from `learning_paths`.

## Add Platform Admin

Run this after the user has signed in at least once and exists in `auth.users`:

```sql
insert into platform_admins (user_id)
select id
from auth.users
where email = 'your-email@example.com'
on conflict (user_id) do nothing;
```

The platform-admin row is different from a path-admin membership. Platform admins are platform-wide operators; path admins manage one learning path.

## Test Bed Seed Data for UX and Role Testing

Use the Supabase Auth UI, the admin API, or a server-side script to create the test users first. Once the auth users exist, seed the role data and sample paths below. This creates a realistic role matrix for the product flow without creating any production data.

```sql
-- 1) Create or upsert profile rows for the test accounts
insert into profiles (user_id, display_name, avatar_url, bio, social_links, repo_links, profile_visibility)
values
  ('<visitor-user-id>', 'Visitor User', null, 'A new member exploring the public wall.', '[]'::json, '[]'::json, 'joined_paths_only'),
  ('<learner-user-id>', 'Aria Learner', null, 'Studying for an onboarding certification.', '[]'::json, '[]'::json, 'joined_paths_only'),
  ('<moderator-user-id>', 'Marcus Moderator', null, 'Helps moderate learning path requests.', '[]'::json, '[]'::json, 'joined_paths_only'),
  ('<path-admin-user-id>', 'Priya Admin', null, 'Owns and manages a certification path.', '[]'::json, '[]'::json, 'public'),
  ('<platform-admin-user-id>', 'Jordan Super Admin', null, 'Platform-wide admin and reviewer.', '[]'::json, '[]'::json, 'public')
on conflict (user_id) do update
set display_name = excluded.display_name,
    bio = excluded.bio,
    profile_visibility = excluded.profile_visibility;

-- 2) Platform admin seed for the super-admin user
insert into platform_admins (user_id)
values ('<platform-admin-user-id>')
on conflict (user_id) do nothing;

-- 3) Create a public path and attach a path admin
insert into learning_paths (id, title, description, tags, created_by, visibility, wall_status, created_at, updated_at)
values (
  'test-path-public',
  'Cloud Foundations Bootcamp',
  'A guided onboarding path for cloud platform learners.',
  array['cloud', 'security', 'starter'],
  '<path-admin-user-id>',
  'public',
  'approved',
  now(),
  now()
)
on conflict (id) do nothing;

insert into path_memberships (user_id, path_id, role, status, joined_at, decided_at)
values
  ('<path-admin-user-id>', 'test-path-public', 'admin', 'approved', now(), now()),
  ('<learner-user-id>', 'test-path-public', 'learner', 'approved', now(), now()),
  ('<moderator-user-id>', 'test-path-public', 'moderator', 'approved', now(), now()),
  ('<visitor-user-id>', 'test-path-public', 'learner', 'pending', now(), null)
on conflict do nothing;

-- 4) Seed phases, days, and lesson items for the public path
insert into phases (id, path_id, title, goal, sort_order)
values
  ('phase-1', 'test-path-public', 'Orientation', 'Get familiar with the platform and setup.', 0),
  ('phase-2', 'test-path-public', 'Hands-on labs', 'Apply the core concepts in guided exercises.', 1)
on conflict (id) do nothing;

insert into days (id, phase_id, day_label, title, hours, sort_order)
values
  ('day-1', 'phase-1', 'Day 1', 'Setup and intro', '2', 0),
  ('day-2', 'phase-2', 'Day 2', 'Console lab', '3', 0)
on conflict (id) do nothing;

insert into lesson_items (id, day_id, title, url, tag, sort_order)
values
  ('item-1', 'day-1', 'Read onboarding guide', 'https://example.com/guide', 'hands', 0),
  ('item-2', 'day-2', 'Cloud lab walkthrough', 'https://example.com/lab', 'hands', 0),
  ('item-3', 'day-2', 'Quick assessment', 'https://example.com/quiz', 'exam', 1)
on conflict (id) do nothing;

-- 5) Add progress for the learner
insert into progress (user_id, path_id, item_key, done, updated_at)
values
  ('<learner-user-id>', 'test-path-public', 'item-1', true, now()),
  ('<learner-user-id>', 'test-path-public', 'item-2', false, now())
on conflict (user_id, path_id, item_key) do update
set done = excluded.done,
    updated_at = now();
```

Recommended user matrix for UI testing:

- Visitor user: no path membership, can browse public content only
- Learner user: approved in at least one path, sees plan and leaderboard
- Moderator user: can approve path join requests and manage a path
- Path admin: can create and edit a path, update plan, manage members
- Platform admin: can access all platform pages and the admin console

This gives the team a realistic way to validate the design and navigation for each persona.

## AI Learning Foundations Seed

The live test database also contains the public, approved `AI Learning Foundations` path. It is an original curriculum designed to exercise a complete plan view:

- 3 phases: AI literacy and responsible use, generative-AI workflows, and repeatable practice.
- 6 learning days.
- 12 lesson items, using `hands` and `exam` tags.
- A platform-admin creator with an approved path-admin membership.

The path is intentionally public and approved so it appears on the Wall and can be used to review filtering, path-board progress, notes, and role-based management. Lesson links point to public primary resources; titles and learning objectives are original to this project.

## AI-Enabled Software Engineering Sprint Seed

The live test database also contains the public, approved `AI-Enabled Software Engineering Sprint` path. It is an original practice roadmap for engineers adopting AI responsibly in product delivery:

- 4 phases: AI-assisted development, reliable model capabilities, retrieval and workflow systems, and a capstone.
- 8 learning days.
- 16 lesson items, using `hands` and `exam` tags.
- A platform-admin creator with an approved path-admin membership.

The broad competency progression was informed by a publicly viewable AIParth software-engineer roadmap. No proprietary curriculum text, branding, visual assets, or source-specific lesson material was copied. The path uses original objectives and public primary sources so it can be safely used for product and role testing.

## Verify Platform Admin

```sql
select
  pa.user_id,
  u.email
from platform_admins pa
join auth.users u on u.id = pa.user_id
where u.email = 'your-email@example.com';
```

Expected result: one row for the signed-in user.

## Verify Path Membership and Creator Role

```sql
select
  pm.user_id,
  pm.path_id,
  pm.role,
  pm.status,
  lp.title
from path_memberships pm
join learning_paths lp on lp.id = pm.path_id
where pm.path_id = 'YOUR-PATH-ID';
```

When a user creates a path, the database trigger should create:

```text
role   = admin
status = approved
```

The API does not insert this admin row manually.

## Approve One Path for the Public Wall

A newly created path defaults to private and pending review. To make one path public and approved:

```sql
update learning_paths
set
  visibility = 'public',
  wall_status = 'approved',
  updated_at = now()
where id = 'YOUR-PATH-ID';
```

Verify it:

```sql
select
  id,
  title,
  visibility,
  wall_status
from learning_paths
where id = 'YOUR-PATH-ID';
```

The path appears on the public wall only when both conditions are true:

```text
visibility  = public
wall_status = approved
```

## Approve All Existing Paths

Use this only when every existing path is intentionally approved for public listing:

```sql
update learning_paths
set
  visibility = 'public',
  wall_status = 'approved',
  updated_at = now();
```

## Make Future Paths Public by Default

The application currently creates new paths as private and pending review. If the product decision is to approve every new path automatically, change the database defaults:

```sql
alter table learning_paths
alter column visibility set default 'public';

alter table learning_paths
alter column wall_status set default 'approved';
```

This bypasses the intended review workflow. The safer production default is private plus pending review.

## Return a Path to Private or Unlisted

```sql
update learning_paths
set
  visibility = 'private',
  wall_status = 'unlisted',
  updated_at = now()
where id = 'YOUR-PATH-ID';
```

## Useful Inspection Queries

List paths:

```sql
select
  id,
  title,
  visibility,
  wall_status,
  created_by,
  created_at,
  updated_at
from learning_paths
order by created_at desc;
```

List members for a path:

```sql
select
  pm.user_id,
  u.email,
  pm.role,
  pm.status,
  pm.joined_at,
  pm.decided_at
from path_memberships pm
join auth.users u on u.id = pm.user_id
where pm.path_id = 'YOUR-PATH-ID'
order by pm.joined_at;
```

Inspect the plan:

```sql
select
  p.title as phase,
  d.day_label,
  d.title as day_title,
  li.title as lesson,
  li.url,
  li.tag
from phases p
join days d on d.phase_id = p.id
join lesson_items li on li.day_id = d.id
where p.path_id = 'YOUR-PATH-ID'
order by p.sort_order, d.sort_order, li.sort_order;
```

Inspect progress:

```sql
select
  user_id,
  path_id,
  item_key,
  done,
  updated_at
from progress
where path_id = 'YOUR-PATH-ID'
order by updated_at desc;
```

## Security Reminders

- Never put a service-role key in SQL files, documentation, screenshots, or source code.
- Never commit `.env.local`.
- Rotate a service-role key if it is exposed.
- Use the service role only in server-side code.
- Keep tenant operations scoped by `path_id`.
