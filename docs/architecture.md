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
Next.js App Router + Route Handlers
              |
              | server-side Supabase clients
              v
Supabase Auth + PostgreSQL + Row Level Security
              |
              +--> platform_admins
              +--> learning_paths
              +--> path_memberships
              +--> profiles
              +--> progress / notes / badges / other path data
```

Supabase Auth establishes authentication identity. The `profiles` record supplies the product-facing learner identity such as display name, avatar, bio, links, and visibility preferences.

## Repository Structure

```text
app/
  page.tsx                         Public discovery homepage
  explore/page.tsx                 Full public Explore / Learning Wall
  journey/page.tsx                 Authenticated My Journey dashboard
  auth/page.tsx                    Email OTP authentication
  paths/page.tsx                   Signed-in user's paths (compatibility route)
  paths/[pathId]/page.tsx          Learning Space / path board
  paths/[pathId]/settings/page.tsx Path settings and creator controls
  paths/[pathId]/approvals/page.tsx Moderator/admin approvals
  admin/page.tsx                   Platform admin workspace
  api/                             Server API route handlers
components/
  discovery/                       Shared homepage and Explore experience
  journey/                         Shared learner dashboard experience
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
  api.ts                           Cross-client API fetch wrapper
  utils.js                         Shared formatting helpers
types/database.ts                  Database type definitions
docs/                              Maintained project documentation
proxy.ts                            Next.js session refresh and route protection
```

New UI work should reuse the current Next.js/React/Tailwind/CSS stack rather than introduce a separate UI framework unless there is an explicit architectural decision to do so.

## Product Information Architecture

```text
ODU
 |
 +-- Explore / Learning Wall
 |      +-- Topics
 |      +-- Search
 |      +-- Approved public Learning Paths
 |
 +-- My Journey
 |      +-- Current goals
 |      +-- Active Learning Spaces
 |      +-- Progress
 |      +-- Next action
 |      +-- Personal Notes
 |      +-- Future achievements
 |
 +-- Learning Space
 |      +-- Overview
 |      +-- Learning Path
 |      +-- Members
 |      +-- Progress
 |      +-- Future Discussions / Resources / Challenges
 |
 +-- AI Companion (planned/supporting capability)
 |
 +-- Platform Admin (protected)
```

This information architecture is a UX model, not a request to create matching database tables.

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

## Authorization Model

ODU has two authority levels:

1. **Platform Admin / Super Admin** — platform-wide authority represented by `platform_admins`.
2. **Path-scoped roles** — `admin`, `moderator`, and `learner` stored in `path_memberships` for a specific `path_id`.

The same person can hold different path roles simultaneously:

```text
User A
  Path A -> admin
  Path B -> moderator
  Path C -> learner
```

A Path Admin is not a Platform Admin. A Moderator is not a Path Admin. These distinctions must be preserved in both server authorization and UI.

The database schema defines helper functions such as:

- `get_role(path_id)`
- `is_approved_member(path_id)`
- `is_moderator_or_above(path_id)`
- `is_path_admin(path_id)`
- `is_platform_admin()`
- `path_is_public(path_id)`

Authorization expectations:

- Public discovery may expose only approved public paths and fields intentionally designed for public viewing.
- Private path content remains restricted to approved members and authorized operators.
- Normal path roles remain constrained to their own `path_id` tenant.
- A Moderator has only delegated permissions explicitly granted to moderators; moderator status must not imply all Path Admin permissions.
- A Path Admin can manage their own path according to the current authorization model but cannot approve their own path for platform publication.
- Platform Admin authority is separate from path membership and may operate across paths only for explicitly supported platform operations.
- Client-side visibility is never an authorization boundary.

## Authentication and Identity

Authentication and product profile identity are intentionally separate:

```text
Supabase Auth
   |
   +--> user id / session / email
             |
             v
        profiles table
             |
       +-----+------------------+
       |                        |
 display_name               avatar_url
       |                        |
       +-----------+------------+
                   v
       Header / Journey / Community / Profile
```

Rules:

- Supabase Auth answers **who is authenticated**.
- `profiles` answers **how that person is represented in ODU**.
- Product-facing display names should prefer `profiles.display_name` over auth `user_metadata`.
- Product-facing avatars should use `profiles.avatar_url`, with initials/fallback when absent or invalid.
- Profile visibility defaults to joined-paths-only unless the user explicitly opts into a public profile.
- Do not duplicate editable profile identity into auth metadata merely to make UI rendering easier.

Authentication flows should use the canonical authenticated destination `/journey` for a normal signed-in learner unless a future deep-link/return-to destination explicitly overrides it.

## Creator Entitlements and Usage Limits

Creating a Learning Path is a product capability available to every registered user; it is not restricted to Platform Admins. The creator automatically becomes the path's `admin` membership through the existing database trigger.

The current default creator entitlement is:

```text
maxCreatedPaths = 3
```

This means each registered user may create/own up to three Learning Paths. Joining another user's path does not consume creator allowance. The allowance counts created/owned paths regardless of whether they are public or private.

The entitlement is distinct from authorization roles:

```text
Creator entitlement
  -> determines whether another path may be created

Path membership role
  -> determines what the user may do inside a specific path

Platform Admin
  -> determines platform-wide protected operations
```

The limit must be enforced at a trusted server/database boundary, not only in the browser. UI may display usage such as `2 of 3 Learning Paths used`, but UI checks are advisory. Server-side enforcement must account for concurrent create requests so simultaneous requests cannot bypass the allowance.

The implementation should avoid scattering the literal `3` through components. Treat `maxCreatedPaths` as a configurable entitlement so future subscription tiers can increase the allowance without changing the tenant model or role hierarchy. Subscription/payment infrastructure is not part of the current architecture.

The persistence model uses:

- `user_entitlements(user_id, max_created_paths, updated_at, updated_by)` for the current creator allowance.
- `quota_requests(...)` for one-user-at-a-time pending requests and the Platform Admin review audit trail.

Usage is derived with `count(*) from learning_paths where created_by = user_id`; there is no mutable created-path counter. Deleting an owned path therefore restores one available slot automatically.

Recommended creation decision flow:

```text
Authenticated user
       |
       v
Read trusted creator entitlement + current usage
       |
       +---- usage < maxCreatedPaths ----> create path
       |                                      |
       |                                      v
       |                              creator -> admin membership
       |
       +---- usage >= maxCreatedPaths ----> reject creation
```

The creation endpoint remains responsible for authorization and entitlement enforcement. PostgreSQL RLS and trusted server-side checks remain the final security boundary.

The trusted creation path is the `create_learning_path_with_entitlement` security-definer function. It takes a per-user advisory transaction lock, reads or creates the entitlement, counts current owned paths, and inserts only when capacity remains. The existing `on_path_created` trigger still creates the approved admin membership.

Quota review uses the `review_quota_request` security-definer function. It verifies Platform Admin identity, locks the pending request, updates the entitlement on approval, and records reviewer/status timestamps in one transaction.

The authenticated `/account` surface is an identity and capacity view, not an authorization boundary. All path deletion, creation, and quota-review permissions are enforced by server-side checks and database policies/functions.

## Path Creation and Publication

Any registered user can create a Learning Path. The creator automatically becomes the path's `admin` membership through the existing database trigger.

Visibility and platform publication are separate:

```text
User creates path (within creator entitlement)
      |
      v
Creator = Path Admin
      |
      +---- private ------------------> approved members / authorized operators
      |
      +---- public --> Platform Admin review
                              |
                       +------+------+
                       |             |
                    approved      rejected
                       |
                       v
                Public Learning Wall
```

The effective public-discovery condition is:

```text
learning_paths.visibility = 'public'
AND
learning_paths.wall_status = 'approved'
```

A Path Admin cannot self-approve public publication. Platform Admin is the authority for platform publication review.

## Core User Journeys

### Visitor

1. Lands on the discovery-focused home experience.
2. Searches or browses approved public Learning Paths.
3. Reviews a path overview.
4. Chooses Start Learning / Join.
5. Is sent to authentication if unauthenticated.

### Learner

1. Signs in and lands in My Journey.
2. Requests to join a Learning Space when necessary.
3. Enters approved paths.
4. Follows the structured Learning Path.
5. Tracks personal progress and Personal Notes.
6. Sees permitted Community Progress and future achievements.

### Path Creator / Admin

1. Authenticates as a normal registered user.
2. Checks available creator entitlement.
3. Creates a Learning Path when within the allowance.
4. Automatically receives approved `admin` membership for that path.
5. Manages path metadata, learning plan, visibility, and permitted membership operations.
6. Can add/delegate Moderators according to the supported product permissions.
7. Cannot perform Platform Admin publication approval merely by owning the path.

### Moderator

1. Has a moderator membership on a specific path.
2. Uses path-specific moderation controls available to that role.
3. Can review membership requests where permitted.
4. Cannot inherit unrestricted Path Admin or Platform Admin capabilities.

### Platform Admin

1. Uses the protected platform admin workspace.
2. Reviews newly created public-path publication requests.
3. Approves, rejects, or unlists paths through supported platform operations.
4. Performs other explicit platform-level moderation/administration.
5. Remains separate from ordinary path membership and learner navigation.

## Profiles, Badges, and Recognition

Profiles can contain display name, avatar, bio, social links, repository links, badges, and visibility preferences. Badge presentation must obey profile visibility and path membership rules.

Badges are intended to support recognition rather than points-first gamification. They may be awarded automatically for learning milestones or manually by authorized path operators. Badge awards should retain an audit trail containing the recipient, badge, source, actor where applicable, path context where applicable, timestamp, and reason/milestone context where supported by the schema.

## API and Mobile Compatibility

The API remains resource-oriented and path-scoped. The existing `/api/paths/...` family is the compatibility contract for future clients.

A React Native client can authenticate with Supabase, securely store its session, send the access token to the server APIs, and render native experiences using the same path, membership, plan, progress, notes, and leaderboard contracts. It must not access PostgreSQL directly.

Future aggregated endpoints such as `/api/journey` may be introduced where a personalized screen otherwise requires excessive client-side requests; such changes should be deliberate API design work, not a UI-only assumption.

## UI Architecture Direction

The product UI should feel calm, modern, structured, motivating, and trustworthy.

Design rules:

- Discovery comes before administration on public surfaces.
- Creation should be visible as a normal product action: users can both join a Learning Journey and lead one by creating a Learning Path.
- Creator usage can be surfaced in creation/Journey UX without exposing internal authorization details.
- The next useful learning action should be easy to identify.
- Primary actions use a consistent solid treatment; secondary actions stay quieter.
- Positive progress may use restrained success treatment rather than heavy gamification.
- Avoid excessive gradients, glassmorphism, glow, stock photography, and decorative metrics.
- Use reusable UI primitives and domain components across Explore, My Journey, Learning Spaces, profiles, settings, and admin.
- Responsive behavior and accessibility are part of the architecture.
- Do not expose platform-admin actions in normal learner navigation.
- Do not visually imply permissions a role does not have.

## Current Implementation Boundary

Implemented foundation includes authentication, public discovery, user-created paths, creator-to-admin behavior, path metadata and plans, membership requests/approvals, progress, leaderboard data, notes, profile management, and path-scoped APIs. The current product-experience layer includes `/explore`, `/journey`, Learning Space-oriented path-board UX, shared path cards, and responsive/accessibility improvements.

The next work should improve identity/authentication consistency, role-aware journeys, creator entitlement enforcement and creator UX, moderator management, platform publication administration, and then community/AI/engagement capabilities in roadmap order.

Security, tenant isolation, entitlement enforcement, and database behavior must not be weakened as the UX evolves.
