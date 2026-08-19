# Architecture

## System Shape

```text
Web browser or React Native client
              |
              | HTTPS + Supabase access token
              v
Next.js route handlers under app/api
              |
              | server-side Supabase client
              v
Supabase Auth + PostgreSQL + Row Level Security
```

The web and future mobile clients use the same HTTP API. The web browser stores its Supabase session through `@supabase/ssr`; React Native can attach the access token using `Authorization: Bearer <token>`.

## Repository Structure

```text
app/
  page.tsx                         Public wall
  auth/page.tsx                    Email OTP authentication
  paths/page.tsx                  Signed-in user's paths
  paths/[pathId]/page.tsx         Path board
  paths/[pathId]/settings/page.tsx Admin path settings
  paths/[pathId]/approvals/page.tsx Moderator/admin approvals
  api/                            Path-scoped route handlers
components/
  PathBoard.tsx
  PathSettings.tsx
  ApprovalsPanel.tsx
  CreatePathForm.tsx
  Header.js, Footer.js, LoadingSpinner.js
lib/
  supabase/client.ts              Browser Supabase client
  supabase/server.ts              SSR and service-role clients
  auth.ts                          Session and platform-admin helpers
  path-auth.ts                     Path membership authorization helpers
  api.ts                           Cross-client fetch wrapper
  utils.js                         Shared formatting helpers
types/database.ts                  Temporary hand-written Supabase types
docs/                              Maintained project documentation
proxy.ts                            Next.js 16 session refresh and route protection
```

## Tenant Model

`learning_paths` is the tenant root. Content tables point to a path directly or through a controlled parent hierarchy:

```text
learning_paths
  -> phases
    -> days
      -> lesson_items

path_memberships(user_id, path_id, role, status)
progress(user_id, path_id, item_key)
notes(user_id, path_id, item_key)
feedback(user_id, path_id)
```

The direct `path_id` columns on activity tables make tenant filtering explicit and keep RLS policies auditable.

## Authorization

The database schema defines these `SECURITY DEFINER` helper functions:

- `get_role(path_id)`
- `is_approved_member(path_id)`
- `is_moderator_or_above(path_id)`
- `is_path_admin(path_id)`
- `is_platform_admin()`
- `path_is_public(path_id)`

The API also performs explicit checks so clients receive meaningful `401` and `403` responses. API code uses the server service-role client for controlled operations, so those checks are important; PostgreSQL RLS remains the intended database-level boundary for direct authenticated access.

## Authentication

- `lib/supabase/client.ts` creates the browser client with the publishable/anon key.
- `lib/supabase/server.ts` creates the cookie-aware SSR client and the server-only service-role client.
- `lib/auth.ts` resolves a caller from a Bearer token first and then from the SSR cookie session.
- `proxy.ts` refreshes web sessions and protects application routes. API handlers still validate authentication themselves, which is required for mobile clients.

## Forward Compatibility

The API has no dependency on browser-only navigation or cookies. A React Native client can:

1. Use the Supabase React Native client for OTP/magic-link authentication.
2. Store the returned session using a mobile storage adapter.
3. Send the access token to the same `/api/paths/...` endpoints.
4. Render native screens using the same path, membership, plan, progress, notes, and leaderboard contracts.

## Current Phase Boundary

Implemented now: wall, path creation, path metadata, plan display/editing, membership requests, approvals, progress, leaderboard, and notes.

Planned later: richer profile management, platform-admin wall moderation UI, badges, notifications, analytics, and production observability.
