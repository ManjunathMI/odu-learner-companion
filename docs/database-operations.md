# Database Operations

This file records the SQL operations used during local setup and testing. It intentionally contains no credentials or service-role keys.

## Canonical Schema

Run the canonical `phase1-schema.sql` from the private design materials in Supabase SQL Editor, from top to bottom. Do not run the deleted legacy single-room schema.

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
- RLS policies, helper functions, grants, and the creator-admin trigger

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
