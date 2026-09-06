# ODU Learner Companion

> **Learn anything. Together.**

ODU Learner Companion is a collaborative learning platform for students, working professionals, and lifelong learners. It helps people discover what they want to learn, join or create a Learning Space around that goal, follow a structured Learning Path, collaborate, track progress, and eventually use AI assistance to improve the learning experience.

ODU is designed to be more than a learning tracker and more focused than a course marketplace or generic social network. Structured learning provides direction; learning together provides motivation, context, and shared knowledge.

## Product Experience

```text
Discover
   -> Choose a learning goal
   -> Join or create a Learning Space
   -> Learn
   -> Collaborate
   -> Practice
   -> Track progress
   -> Reflect
   -> Grow
```

### Key concepts

- **Explore / Learning Wall** — discover approved public Learning Paths and learning topics.
- **Learning Path** — a structured sequence of phases, days, and lesson items.
- **Learning Space** — the collaborative experience around a Learning Path. It is currently a UX/product concept built on the existing `learning_paths` tenant; it is not a separate database hierarchy.
- **My Journey** — a personal view of current goals, active Learning Spaces, progress, next action, Personal Notes, and future achievements.
- **AI Companion** — a planned supporting capability. The UI must not claim AI features until they are implemented.

## Roles and Authority

ODU has one platform-level administrative role and three path-scoped operational roles.

| Role | Scope | Core responsibility |
|---|---|---|
| Visitor | Platform | Discover approved public Learning Paths |
| Learner | Per Learning Path | Learn, track progress, keep Personal Notes, participate |
| Moderator | Per Learning Path | Perform explicitly delegated moderation actions |
| Path Admin / Space Creator | Per Learning Path | Manage the Learning Path / Learning Space |
| Platform Admin / Super Admin | Platform | Review public publication and perform protected platform operations |

Any registered user can create a Learning Path and automatically becomes its Path Admin through the existing database trigger. A person may be an Admin on one path, Moderator on another, and Learner on a third at the same time.

**Path Admin and Platform Admin are not the same role.** A Path Admin manages their own path but cannot approve that path for public publication. A Moderator does not automatically inherit all Path Admin permissions.

## Creator Entitlement and Usage Limits

Creating a Learning Path is a normal registered-user capability, not an administrator-only action.

The current default creator allowance is:

```text
maxCreatedPaths = 3
```

Each registered user can create/own up to 3 Learning Paths under the default allowance. This count applies regardless of whether the paths are public or private. Joining an existing Learning Path does **not** consume creator allowance.

The allowance is an entitlement separate from authorization roles:

```text
Creator entitlement -> may I create another path?
Path role          -> what may I do inside this path?
Platform Admin     -> what protected platform-wide operations may I perform?
```

The limit must be enforced server-side at the trusted server/database boundary. UI counters such as `2 of 3 Learning Paths used` are for user guidance and are not security controls. Creation checks should also handle concurrent requests so the allowance cannot be bypassed by simultaneous submissions.

The implementation should treat `maxCreatedPaths` as configurable rather than scattering the literal `3` through the UI. Future subscription tiers may increase the allowance. Subscription and payment infrastructure are not part of the current implementation.

ODU should make both modes visible:

- **Join a Learning Journey** — discover and join an existing Learning Space.
- **Lead a Learning Journey** — create a Learning Path, become its Path Admin, and build the Learning Space for a group or community.

Creation should be promoted in normal product surfaces such as the homepage, Explore, and My Journey rather than being hidden inside platform administration.

## Path Visibility and Publication

A Learning Path has two separate concepts:

1. **Visibility** — chosen by the Path Admin: `public` or `private`.
2. **Platform publication status** — controlled by Platform Admin: `pending_review`, `approved`, `rejected`, or `unlisted`.

A public path appears on the Learning Wall only when both conditions are satisfied:

```text
visibility = public
AND
wall_status = approved
```

The intended workflow is:

```text
Registered User
      |
      | create path (within creator entitlement)
      v
Creator automatically becomes Path Admin
      |
      +---- private ------------------> approved members / authorized operators
      |
      +---- public --> Platform Admin review --> approved --> Public Learning Wall
                                      |
                                      +-----------> rejected
```

Changing a path to public must never bypass platform review.

## Profiles, Privacy, and Badges

Authentication identity and product profile identity are separate.

- Supabase Auth establishes the authenticated user/session.
- The `profiles` record supplies display name, avatar, bio, social links, repository links, visibility preferences, and profile presentation data.
- Profile visibility defaults to **joined-paths-only** unless the user explicitly opts into a public profile.
- Badges are intended for learning recognition and may be awarded automatically for milestones or manually by authorized path operators.
- Badge awards should have an audit trail and respect path scope and profile privacy.

## Current Capabilities

The current foundation includes:

- Supabase email OTP or magic-link authentication.
- Approved public Learning Path discovery.
- User-created Learning Paths.
- Automatic creator-to-Path-Admin membership through a database trigger.
- Nested plans: phases → days → lesson items.
- Path-scoped membership requests and approval workflows.
- Progress tracking and Community Progress/leaderboard data.
- Personal Notes attached to lesson items.
- Profile management.
- Row Level Security plus explicit server-side authorization.
- Path-scoped APIs designed for future web and mobile clients.
- GitHub Actions CI for lint and production-build validation.
- `/explore` discovery experience.
- `/journey` personal learning experience.
- Shared Learning Path card language across Explore and Journey.

## Security and Tenant Model

`learning_paths` remains the tenant root:

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

Every path-owned operation must remain scoped by `path_id`. PostgreSQL RLS and server-side authorization are the final security boundaries.

Do not introduce a second `learning_spaces` tenant hierarchy just to support the UX terminology.

## Technology

- Next.js 16 App Router and Route Handlers.
- React 19 and TypeScript.
- Supabase Auth and PostgreSQL.
- `@supabase/ssr` for browser cookie sessions.
- Native `fetch` API client with Bearer-token support for future mobile clients.
- CSS custom properties and the existing application styling system.

## Repository Layout

```text
app/
  page.tsx                         Public discovery homepage
  explore/page.tsx                 Public Explore / Learning Wall
  journey/page.tsx                 Authenticated My Journey
  auth/page.tsx                    Authentication
  paths/page.tsx                   Existing paths route / compatibility surface
  paths/[pathId]/page.tsx          Learning Space / path board
  paths/[pathId]/settings/page.tsx Path settings
  paths/[pathId]/approvals/page.tsx Approval queue
  admin/page.tsx                   Platform admin workspace
  api/                             Server API route handlers
components/                        Reusable domain and UI components
lib/                               Auth, authorization, API, and Supabase helpers
types/database.ts                  Database type definitions
docs/                              Canonical product and engineering documentation
.github/prompts/                   Reusable GitHub Copilot prompt files
AGENTS.md                          Durable agent/project memory
proxy.ts                            Next.js session refresh and route protection
```

## Getting Started

### Prerequisites

- Node.js 22 or later recommended.
- npm.
- A Supabase project.
- The canonical `phase1-schema.sql` supplied with the project design materials.

### Install

```bash
git clone <your-fork-url>
cd odu-learner-companion
npm install
```

### Configure environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret-key
```

Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`. Do not prefix it with `NEXT_PUBLIC_`.

### Set up the database

Run the canonical `phase1-schema.sql` from top to bottom in the Supabase SQL Editor. Do not run legacy single-room schemas or create a parallel tenant hierarchy for Learning Spaces.

To designate a platform administrator when required:

```sql
insert into platform_admins (user_id)
select id from auth.users where email = 'your-email@example.com';
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Verify

```bash
npm run lint
npm run build
```

## Canonical Documentation

The `docs/` directory is the single source of truth for product and engineering decisions. Update an existing canonical document rather than creating competing versions.

- [Business guide](docs/business-guide.md) — product vision, vocabulary, roles, workflows, publication, profiles, badges, business rules, and creator entitlement.
- [Architecture](docs/architecture.md) — system shape, tenant model, identity, authorization, creator entitlement, information architecture, and UI architecture.
- [Roadmap](docs/roadmap.md) — phased implementation plan, creator experience, entitlement enforcement, and product decisions.
- [Development guide](docs/development.md) — local setup, environment variables, database setup, and verification.
- [API reference](docs/api.md) — HTTP endpoints and response contracts.
- [Database operations](docs/database-operations.md) — database setup and operational SQL.
- [Documentation index](docs/README.md) — maintained document map.
- [Deployment guide](DEPLOYMENT.md) — Vercel deployment and operational notes.

## Building the Product Step by Step

Use `.github/prompts/odu-next-step.prompt.md` with GitHub Copilot for incremental implementation. Work on one bounded task at a time. Before changing code, inspect the current implementation and canonical docs; after changing code, run lint/build and manually validate the affected user journey.

### Immediate next priorities

1. **Identity and Authentication Journey** — make Start Learning session-aware, land authenticated users in My Journey, and make Header identity use the profile display name and avatar.
2. **Role-aware navigation and permissions UX** — ensure Learner, Moderator, Path Admin, and Platform Admin see only the actions relevant to their scope.
3. **Creator entitlement and creation UX** — enforce the default creator allowance server-side and make Create a Learning Path visible across the product.
4. **Product Experience consolidation** — finish Explore, My Journey, and Learning Space UX and accessibility refinement.
5. **Creator and Community** — guided plan editor, membership/moderator management, community features, and platform publication administration.
6. **AI Companion** — implement only when backend capabilities are ready.
7. **Engagement and recognition** — badges, milestones, and related recognition workflows.
8. **Production readiness**, then **mobile**.

## Future Mobile Client

The APIs are designed to be reused by React Native clients. A mobile client should authenticate with Supabase, securely store its session, send the access token as a Bearer token, and use the same server-side `/api/paths/...` contracts. It must not access the database directly.

## Contribution Principles

- Make focused, reviewable changes.
- Keep tenant-owned operations scoped by `path_id`.
- Keep Platform Admin, Path Admin, Moderator, and Learner permissions distinct.
- Keep platform publication approval separate from path visibility.
- Keep product profile identity separate from authentication identity.
- Treat creator allowance as a configurable entitlement enforced at the trusted server/database boundary.
- Do not change database schema, RLS, auth, API contracts, or authorization boundaries during a UI-only task unless explicitly requested.
- Reuse existing APIs and components where practical.
- Do not claim or visually imply functionality that is not implemented.
- Do not introduce duplicate product/architecture documents for the same decision.
- Never commit secrets or `.env.local`.
- Run `npm run lint` and `npm run build` before considering a change complete.

## License

Add the project's chosen license before public distribution.
