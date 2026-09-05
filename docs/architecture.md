# Architecture

## Product Architecture Principles

ODU Learner Companion is a collaborative learning product for students, working professionals, and lifelong learners. The architecture should support a polished discovery-first experience while keeping the existing tenant, authentication, and authorization model stable.

Core principles:

- `learning_paths` remains the tenant root.
- A Learning Space is a product/UX concept around a learning path, not a second database tenant hierarchy at this stage.
- The web experience should make discovery, the learner's next useful action, and collaboration easy to understand.
- AI is a supporting capability and must never be represented in the UI as implemented until the corresponding backend capability exists.
- PostgreSQL RLS and explicit server-side authorization remain the security boundary.
- Web and future mobile clients use the same server API contracts.
- Product terminology may evolve independently from database table names, but must not imply broader permissions than the actual role model provides.

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

The application remains intentionally simple: Next.js owns the presentation layer and server API, while Supabase owns authentication, persistence, and database-level authorization.

## Repository Structure

```text
app/
  page.tsx                         Public discovery homepage
  explore/page.tsx                 Full public Explore / Learning Wall
  journey/page.tsx                 Authenticated My Journey dashboard
  auth/page.tsx                    Email OTP authentication
  paths/page.tsx                  Signed-in user's paths (compatibility route)
  paths/[pathId]/page.tsx         Learning Space / path board
  paths/[pathId]/settings/page.tsx Path settings and creator controls
  paths/[pathId]/approvals/page.tsx Moderator/admin approvals
  api/                            Path-scoped route handlers
components/
  discovery/                       Shared homepage and Explore experience
  journey/                         Shared learner dashboard experience
  PathBoard.tsx
  PathSettings.tsx
  ApprovalsPanel.tsx
  CreatePathForm.tsx
  Header.js, Footer.js, LoadingSpinner.js
  (future UI families may be grouped under components/odu, components/discovery,
   and components/journey as the product surface expands)
lib/
  supabase/client.ts              Browser Supabase client
  supabase/server.ts              SSR and service-role clients
  auth.ts                          Session and platform-admin helpers
  path-auth.ts                     Path membership authorization helpers
  api.ts                           Cross-client API fetch wrapper
  utils.js                         Shared formatting helpers
types/database.ts                  Temporary hand-written Supabase types
docs/                              Maintained project documentation
proxy.ts                            Next.js 16 session refresh and route protection
```

New UI work should reuse the current Next.js/React/Tailwind/CSS stack rather than introduce a separate UI framework unless there is an explicit architectural decision to do so.

## Product Information Architecture

The product experience is organized around a small set of user-facing concepts:

```text
ODU
 |
 +-- Explore / Learning Wall
 |      |
 |      +-- Topics
 |      +-- Search
 |      +-- Public Learning Paths
 |
 +-- Learning Spaces
 |      |
 |      +-- Overview
 |      +-- Learning Path
 |      +-- Members / Progress / future community areas
 |
 +-- My Journey
 |      |
 |      +-- Current goals
 |      +-- Active learning spaces
 |      +-- Progress
 |      +-- Next action
 |      +-- Personal notes
 |
 +-- AI Companion (planned/supporting capability)
```

This information architecture is a UX model, not a request to create matching database tables. Existing routes can remain in place for compatibility while clearer product-facing routes such as `/explore` and `/journey` are introduced.

### Learning Wall

The Learning Wall is a learning-focused discovery surface, not a generic social-media feed. It should help a visitor or learner find relevant learning paths, topics, and opportunities to learn with others.

### Learning Path

A Learning Path is the structured curriculum or sequence inside a Learning Space. Its current database representation remains the path tenant plus nested `phases -> days -> lesson_items`.

### Learning Space

A Learning Space is the collaborative experience built around a Learning Path. It communicates that people learn together without creating a new `learning_spaces` database hierarchy at this stage.

### My Journey

My Journey is the personalized learner view of goals, active spaces, current progress, next action, notes, and future achievements. The current `/paths` route may remain as a compatibility route while this experience is improved.

### AI Companion

The AI Companion is planned as a supporting layer for activities such as explaining topics, creating learning plans, generating quizzes, identifying knowledge gaps, and suggesting next steps. These are product directions, not claims about current implementation.

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

Do not introduce a second tenant relationship through `learning_spaces` unless a future product decision explicitly requires a separate persistence model.

## Authorization

The database schema defines these `SECURITY DEFINER` helper functions:

- `get_role(path_id)`
- `is_approved_member(path_id)`
- `is_moderator_or_above(path_id)`
- `is_path_admin(path_id)`
- `is_platform_admin()`
- `path_is_public(path_id)`

The API also performs explicit checks so clients receive meaningful `401` and `403` responses. API code uses the server service-role client for controlled operations, so those checks are important; PostgreSQL RLS remains the intended database-level boundary for direct authenticated access.

Authorization expectations:

- Public discovery may expose only approved public paths and the fields intentionally designed for public viewing.
- Private path content remains restricted to approved members and authorized administrators.
- Normal path roles remain constrained to their own `path_id` tenant.
- Platform-admin access is an explicit elevated override where the current operation supports it; it does not change the ordinary user permission model.
- A UI label such as “Learning Space” must never imply cross-path access or elevated privileges.

## Authentication

- `lib/supabase/client.ts` creates the browser client with the publishable/anon key.
- `lib/supabase/server.ts` creates the cookie-aware SSR client and the server-only service-role client.
- `lib/auth.ts` resolves a caller from a Bearer token first and then from the SSR cookie session.
- `proxy.ts` refreshes web sessions and protects application routes. API handlers still validate authentication themselves, which is required for mobile clients.

## Role Model

The current role model remains:

```text
Visitor
  -> Learner
  -> Moderator
  -> Path Admin
  -> Platform Admin
```

The product language should be friendlier without changing these privileges:

| Internal role | Product-facing framing |
|---|---|
| Visitor | Discoverer / Visitor |
| Learner | Learner |
| Moderator | Community Moderator |
| Path Admin | Space Creator / Facilitator |
| Platform Admin | Platform Admin |

Role-specific controls should remain contextual. The public header should emphasize discovery and learning; profile and administrative operations belong in the authenticated user menu rather than the primary public navigation.

## Core User Journeys

### Visitor

1. Lands on the discovery-focused home experience.
2. Searches or browses learning topics.
3. Reviews approved public learning paths.
4. Signs in to join or participate.

### Learner

1. Signs in.
2. Opens My Journey and active Learning Spaces.
3. Requests or enters approved paths.
4. Follows the structured learning plan.
5. Marks lessons complete, records personal notes, and reviews progress.
6. Uses community progress signals where available.

### Space Creator / Facilitator

1. Creates a learning path.
2. Becomes the path admin through the existing database behavior.
3. Manages metadata, plan content, and membership.
4. Reviews membership requests and moderation actions.
5. Uses settings and path-specific controls without exposing platform-admin operations.

### Platform Admin

1. Uses the protected admin workspace.
2. Reviews platform-level decisions such as public path approval.
3. Can access supported cross-path administrative operations through explicit authorization.
4. Remains separate from the normal learner navigation model.

## API and Mobile Compatibility

The API should remain resource-oriented and path-scoped. The existing `/api/paths/...` family is the compatibility contract for future clients.

A React Native client can:

1. Use the Supabase React Native client for OTP/magic-link authentication.
2. Store the returned session using a mobile storage adapter.
3. Send the access token to the same `/api/paths/...` endpoints.
4. Render native screens using the same path, membership, plan, progress, notes, and leaderboard contracts.

The mobile client should not access PostgreSQL directly. It should use the same server API and authorization rules as the web client.

## UI Architecture Direction

The product UI should evolve toward a calm, modern, structured interface rather than a neon or highly decorative dashboard.

Design rules:

- Discovery comes before administration on the public surface.
- The next useful learning action should be easy to identify.
- Primary actions use a consistent solid treatment; secondary actions stay quieter.
- Positive progress may use a restrained success treatment rather than heavy gamification.
- Avoid excessive gradients, glassmorphism, glow, stock photography, and decorative metrics.
- Use one coherent display treatment for headings and a readable interface font family for body and controls; exact font implementation should follow repository constraints.
- Build reusable UI primitives and domain components so the same patterns work across Explore, My Journey, Learning Spaces, settings, and admin.
- Responsive behavior is part of the architecture, not a final styling pass.

## Current Implementation Boundary

Implemented foundation:

- Authentication.
- Public wall/discovery data.
- User-created learning paths.
- Creator-to-path-admin membership behavior.
- Path metadata.
- Nested learning plans.
- Membership requests and approval flows.
- Progress tracking.
- Leaderboard.
- Personal notes.
- Profile management.
- Bearer-token-compatible server API.

Next product-layer work should primarily improve the experience around this foundation: discovery, Learning Spaces, My Journey, guided plan editing, membership management, community features, and eventually AI assistance.

Security, tenant isolation, and database behavior must not be weakened as the UX evolves.
