<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ODU Learner Companion Agent Memory

This repository is a Next.js 16 application using the App Router, TypeScript, React 19, and Supabase-based server/client auth and data access. Treat this file as the durable project memory for both implementation and planning.

## Project baseline

- App entry points live under `app/` with route handlers in `app/api/` and page-level routes in `app/paths/` and `app/docs/`.
- Shared API and auth logic lives in `lib/` and the Supabase helpers are under `lib/supabase/`.
- Database schema and type definitions are tracked in `types/database.ts`.
- Build and validation commands are defined in `package.json` and should be used for verification before claiming completion.
- The repo includes design and product docs under `docs/` and `designDocs/`; use them to understand intent before changing behavior.

## Architecture at a glance

This repository is a Next.js App Router application backed by Supabase Auth and PostgreSQL. The product is built around a single shared platform API instead of a separate backend service: the browser, and future mobile clients, interact with the same `/api/...` route handlers and the same path-scoped data model.

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

### Core architectural layers

- Frontend: Next.js 16, React 19, TypeScript
- Auth + persistence: Supabase Auth and Postgres
- API layer: `app/api/*` route handlers
- Shared logic: `lib/*` helpers and auth utilities
- Data contracts: `types/database.ts`
- UI components: `components/*` for reusable screens and panels

### Tenant model

The application treats each learning path as a tenant-like unit. The data model is centered on `learning_paths` and path-scoped membership and activity records:

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

The direct `path_id` columns on activity tables keep access checks explicit and easier to audit in PostgreSQL RLS and app-layer authorization.

### Authorization model

The app uses role-aware path checks, not just global user checks:

- `getMembership(userId, pathId)` resolves a user’s membership record
- `requirePathMember(...)` ensures the user is an approved path member
- `requirePathModerator(...)` allows moderator/admin actions
- `requirePathAdmin(...)` restricts management and mutation operations
- `isPlatformAdmin(...)` allows platform-level override logic while keeping normal users path-scoped

This is implemented in `lib/path-auth.ts` and enforced in route handlers such as `app/api/paths/[pathId]/route.ts`.

### Auth flow

- `lib/supabase/client.ts` creates the browser client for the public app
- `lib/supabase/server.ts` creates the cookie-aware SSR client and the server-only service-role client
- `lib/auth.ts` resolves the current user from a bearer token or SSR session
- `proxy.ts` refreshes sessions and protects app routes

The route handlers still validate authentication and authorization themselves because the API is designed to be reusable by mobile or other non-browser clients.

### User journeys and roles

- Visitor: public wall, approved public path discovery, no private plan access
- Learner: signs in, joins paths, tracks progress, writes notes, views leaderboard
- Path admin: creates and manages paths, memberships, plan content, approvals
- Platform admin: moderated public wall and platform-wide operations

The product experience is intentionally role-based and keeps admin actions within the authenticated user menu rather than exposing internal operations in the primary navigation.

## Memory retention rule

Any understanding gained while working in this repo must be persisted so future builds and future plans can build on the same context.

When you learn something important, record it in the project memory using one of these methods:

1. Update this `AGENTS.md` file with the new fact if it is structural or project-wide.
2. Add a concise note to the repo memory or session memory when the environment supports it.
3. Add or update relevant documentation in `docs/` when the learning affects product, architecture, or workflows.

Important context to preserve includes:

- architecture decisions and why they were chosen
- routes, data flows, and user journeys
- auth and Supabase patterns
- build commands, validation results, and known constraints
- bugs, edge cases, and prior fixes
- open tasks, blockers, and next-step plans

## Planning standard

Before starting major work, review the project memory first. Do not treat prior understanding as disposable or temporary.

When planning new work:

- summarize the current project state
- note what is already known and what is still uncertain
- record the proposed implementation path
- identify how the change affects routes, auth, database access, and user experience
- capture verification steps before the work is considered done

## Current implementation focus

Phase 2 now includes profile management, role-based navigation, a visual plan editor, membership controls, a platform workspace, public-path discovery filtering, and the first learner-board progress pass.

Current delivery focus is completing the remaining experience and production-readiness backlog in `docs/roadmap.md`:

- Validate the role journeys with the seeded visitor, learner, moderator, path-admin, and platform-admin accounts.
- Continue refining Path Settings, approvals, profile, and platform-workspace usability.
- Add automated API authorization and tenant-isolation tests, followed by operational safeguards such as rate limiting, logging, monitoring, and environment procedures.
- Keep platform-admin override logic in `lib/path-auth.ts`; it grants the effective path-admin capability to platform admins while ordinary users remain path-scoped.
- The path board retrieves a member's completed item IDs from `GET /api/paths/:pathId/progress`; do not replace this with client-only progress state.
- GitHub Actions validates lint and production builds on pull requests and pushes to `main` through `.github/workflows/ci.yml`.

## Execution expectations

- Prefer minimal, targeted edits over broad rewrites.
- Match the existing app-router and route-handler conventions already used in the repo.
- Keep instructions and project context aligned with actual code, not assumptions from generic templates.
- If a fact conflicts with prior memory, update the memory and explain the change clearly.
- Do not lose project continuity between sessions or future agents.

## Verification habit

Before claiming success, verify with the repo’s actual commands. For this project, the default validation path is the scripts in `package.json`, including linting and build steps when relevant. Record the result in the relevant memory location so future work knows what has already been tested.

This repo’s project memory should be treated as living documentation: each new understanding strengthens the next build, the next plan, and the next implementation step.
