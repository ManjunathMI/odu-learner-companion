# ODU Learner Companion

> **Learn anything. Together.**

ODU Learner Companion is a collaborative learning platform for students, working professionals, and lifelong learners. It helps people discover what they want to learn, join or create a Learning Space around that goal, follow a structured Learning Path, collaborate with other learners, track progress, and eventually use AI assistance to improve the learning experience.

ODU is designed to be more than a learning tracker and more focused than a course marketplace or generic social network. Structured learning provides direction; learning together provides motivation, context, and shared knowledge.

## Product Experience

The core journey is:

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

- **Explore / Learning Wall** — discover approved public learning paths and learning topics.
- **Learning Path** — a structured sequence of phases, days, and lesson items.
- **Learning Space** — the collaborative experience around a Learning Path. This is currently a product/UX concept built on the existing `learning_paths` tenant; it is not a separate database hierarchy.
- **My Journey** — a personal view of current learning goals, active spaces, progress, next action, notes, and future achievements.
- **AI Companion** — a planned supporting capability for actions such as explaining topics, generating quizzes, identifying gaps, and suggesting next steps. The UI must not claim an AI capability until it is implemented.

## Current Capabilities

The current foundation includes:

- Supabase email OTP or magic-link authentication.
- Approved public learning-path discovery through the wall.
- User-created learning paths.
- Automatic creator-to-path-admin membership through a database trigger.
- Nested plans: phases → days → lesson items.
- Path-scoped membership requests and approval workflows.
- Progress tracking and community leaderboard data.
- Personal notes attached to lesson items.
- Profile management.
- Row Level Security plus explicit server-side authorization.
- Path-scoped APIs designed for future web and mobile clients.
- GitHub Actions CI for lint and production-build validation.

The product roadmap expands this foundation through improved discovery, My Journey, Learning Space UX, creator tools, community features, AI assistance, engagement, production hardening, and eventually mobile clients.

## Roles

| Role | Responsibility |
|---|---|
| Visitor | Discover approved public learning paths |
| Learner | Learn, track progress, keep personal notes, participate in available community features |
| Moderator | Review join requests within a specific path / Learning Space |
| Space Creator / Path Admin | Manage a specific path's metadata, plan, and membership |
| Platform Admin | Handle protected platform-wide operations |

Roles are path-scoped unless explicitly represented as a platform-level role. There is no global path-admin environment flag in the canonical model.

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

Every path-owned operation must remain scoped by `path_id`. PostgreSQL RLS and server-side authorization are the final security boundaries. Product terminology must never imply permissions broader than the actual role model.

Do not introduce a second `learning_spaces` tenant hierarchy just to support the new UX terminology.

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
  page.tsx                         Public discovery / wall experience
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

As the UI grows, new reusable components may be organized under domain-oriented areas such as `components/odu`, `components/discovery`, and `components/journey`. Avoid introducing a new UI framework for ordinary product work.

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

After the first sign-in, a platform admin can be added manually when required:

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

- [Business guide](docs/business-guide.md) — product vision, vocabulary, users, roles, workflows, and business rules.
- [Architecture](docs/architecture.md) — system shape, tenant model, authorization, information architecture, and UI architecture.
- [Roadmap](docs/roadmap.md) — phased implementation plan and product decisions.
- [Development guide](docs/development.md) — local setup, environment variables, database setup, and verification.
- [API reference](docs/api.md) — HTTP endpoints and response contracts.
- [Database operations](docs/database-operations.md) — database setup and operational SQL.
- [Documentation index](docs/README.md) — maintained document map.
- [Deployment guide](DEPLOYMENT.md) — Vercel deployment and operational notes.

## Building the Product Step by Step

Use the reusable Copilot prompt at `.github/prompts/odu-next-step.prompt.md` for incremental implementation. Work on one bounded task at a time. Before changing code, have Copilot inspect the current implementation and the canonical docs; after changing code, run lint/build and manually validate the affected user journey.

The immediate product priority is the **Product Experience** phase:

1. Modernize the homepage around discovery and the message “Learn anything. Together.”
2. Introduce `/explore` as the primary discovery experience while retaining compatible existing routes.
3. Introduce `/journey` as the preferred personalized learning dashboard while retaining `/paths` for compatibility.
4. Refine the existing path board into the Learning Space experience without changing tenant boundaries.
5. Establish a reusable responsive design system and accessible UI primitives.
6. Only then expand creator/community features, AI, engagement, production hardening, and mobile.

## Future Mobile Client

The APIs are designed to be reused by React Native clients. A mobile client should authenticate with Supabase, securely store its session, send the access token as a Bearer token, and use the same server-side `/api/paths/...` contracts. It must not access the database directly.

## Contribution Principles

- Make focused, reviewable changes.
- Keep tenant-owned operations scoped by `path_id`.
- Do not change database schema, RLS, auth, API contracts, or authorization boundaries during a UI-only task unless explicitly requested.
- Reuse existing APIs and components where practical.
- Do not claim or visually imply functionality that is not implemented.
- Do not introduce duplicate product/architecture documents for the same decision.
- Never commit secrets or `.env.local`.
- Run `npm run lint` and `npm run build` before considering a change complete.

## License

Add the project's chosen license before public distribution.
