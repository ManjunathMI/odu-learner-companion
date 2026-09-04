<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ODU Learner Companion Agent Memory

This repository is a Next.js 16 application using the App Router, TypeScript, React 19, and Supabase-based server/client auth and data access. Treat this file as durable project memory for implementation and planning.

## Product Direction

ODU Learner Companion is a collaborative learning companion for students, working professionals, and lifelong learners.

Primary message: **Learn anything. Together.**

Core proposition: **You do not have to learn alone.**

The product journey is:

```text
Discover -> Choose a learning goal -> Join/create a Learning Space
-> Learn -> Collaborate -> Practice -> Track progress -> Reflect -> Grow
```

A Learning Space is currently a product/UX concept around the existing `learning_paths` tenant. Do not create a second `learning_spaces` tenant hierarchy unless explicitly requested.

## Architecture Baseline

- App entry points live under `app/` with API route handlers under `app/api/`.
- Shared auth, authorization, API, and Supabase logic lives under `lib/`.
- Database types are tracked in `types/database.ts`.
- Product and engineering documentation lives in `docs/`, which is the canonical documentation source.
- Build and validation commands are defined in `package.json`.
- Future UI work should reuse the existing Next.js/React/Tailwind/CSS stack rather than introducing a new UI framework without an explicit decision.

```text
Web browser or mobile client
              |
              | HTTPS + Supabase access token
              v
Next.js App Router (app/ + app/api/)
              |
              | server-side Supabase clients
              v
Supabase Auth + PostgreSQL + Row Level Security
              |
              | path-scoped authorization checks
              v
learning_paths / path_memberships / progress / notes / approvals
```

## Tenant Model

`learning_paths` is the tenant root:

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

Every path-owned operation must remain scoped by `path_id`. PostgreSQL RLS and server-side authorization are the security boundaries.

## Authorization Model

The application uses path-aware authorization helpers such as:

- `getMembership(userId, pathId)`
- `requirePathMember(...)`
- `requirePathModerator(...)`
- `requirePathAdmin(...)`
- `isPlatformAdmin(...)`

Platform-admin override behavior must remain explicit. Normal users remain constrained to their path memberships.

Never rely only on client-side visibility for authorization.

## Authentication

- `lib/supabase/client.ts` creates the browser Supabase client.
- `lib/supabase/server.ts` creates the SSR and server-only clients.
- `lib/auth.ts` resolves callers from Bearer tokens or SSR sessions.
- `proxy.ts` refreshes web sessions and protects application routes.
- API handlers must validate authentication independently because APIs are intended for future mobile clients too.

## Product Information Architecture

Preferred product-facing language:

- Explore / Learning Wall — public discovery.
- Learning Path — structured curriculum.
- Learning Space — collaborative experience around a Learning Path.
- My Journey — personalized learning dashboard.
- Personal Notes — learner-owned notes.
- Community Progress — progress/leaderboard experience.
- Space Creator / Facilitator — path admin.
- Platform Admin — platform-level operator.

Preferred future routes:

- `/explore` — discovery.
- `/journey` — personalized learning dashboard.

Existing `/paths` routes should remain usable as compatibility surfaces while the product experience evolves.

## Current Foundation

Implemented capabilities include:

- Supabase email OTP authentication.
- Public wall/discovery data.
- User-created learning paths.
- Creator-to-path-admin membership through a database trigger.
- Path metadata and nested learning plans.
- Membership requests and approval workflows.
- Progress tracking and leaderboard data.
- Personal notes.
- Profile management.
- Path-scoped APIs.
- GitHub Actions lint/build validation.

## Current Delivery Focus

The immediate priority is the Product Experience phase in `docs/roadmap.md`:

1. Modernize the homepage around discovery and “Learn anything. Together.”
2. Introduce `/explore` for topic and learning-path discovery.
3. Introduce `/journey` for the learner's goals, active spaces, progress, and next action.
4. Refine the existing path board into the Learning Space experience.
5. Establish reusable responsive and accessible UI primitives.
6. Then expand creator/community features, AI assistance, engagement, production hardening, and mobile.

Do not implement later-phase functionality merely because it appears in the roadmap. The UI must reflect actual implemented capabilities.

## UI/UX Rules

- Discovery should be more prominent than administration on public surfaces.
- The next useful learning action should be obvious.
- The interface should feel calm, modern, structured, motivating, and trustworthy.
- Prefer restrained visual hierarchy over neon, heavy glow, excessive gradients, glassmorphism, stock imagery, or decorative metrics.
- Use consistent primary/secondary action treatments.
- Positive progress can use restrained success styling.
- Responsive behavior and accessibility are first-class requirements.
- Build reusable domain components instead of page-specific visual drift.

## AI Companion Boundary

AI is a planned supporting capability. Candidate actions include explaining topics, quizzes, learning-plan generation, knowledge-gap identification, and next-step suggestions.

Never claim or visually present an AI capability as available until its backend implementation exists. AI must not silently modify learning plans or learner records.

## Coding and Change Rules

- Prefer minimal, targeted edits.
- Read `docs/business-guide.md`, `docs/architecture.md`, and `docs/roadmap.md` before major product changes.
- Preserve existing API contracts and reuse existing APIs where possible.
- Do not change database schema, RLS, authentication, authorization, API contracts, or tenant boundaries during a UI-only task unless explicitly requested.
- Do not create duplicate documentation for an existing decision; update the canonical document in `docs/`.
- Do not introduce a second tenant hierarchy for Learning Spaces.
- Do not invent product metrics or unimplemented functionality.
- Keep platform-admin and path-scoped operations separate.

## Verification Habit

Before claiming completion:

```bash
npm run lint
npm run build
```

Also manually validate the affected user journey at desktop and mobile widths when the change is UI-related.

Record important architectural or workflow changes in the canonical documentation so future sessions preserve project continuity.
