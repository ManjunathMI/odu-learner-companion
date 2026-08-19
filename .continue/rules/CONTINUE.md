# ODU Learner Companion Project Guide

This repository is a Next.js 16 App Router application for a multi-tenant learning platform. It is not a generic React app and it is not an Express app. The app uses TypeScript, React 19, and Supabase for database and auth.

## Core Product Model

The project is designed around learning paths as tenant-like units. Each path owns its own:

- metadata
- membership
- roles
- approvals
- progress
- notes
- leaderboard
- nested plan content

Key product concepts:

- Visitor: browses approved public paths
- Learner: studies a path, tracks progress, writes notes, views leaderboard
- Moderator: reviews join requests for a specific path
- Path admin: manages one path's metadata, membership, and plan
- Platform admin: manages platform-wide approvals or wall moderation

All path-scoped operations should stay restricted by `path_id` and should use server-side authorization checks.

## Repository Reality

This repo uses the actual App Router structure, not a `src/pages` or `src/app` layout.

### Main directories

- `app/` — app routes and route handlers
  - `app/page.tsx` — public wall/home page
  - `app/auth/page.tsx` — email OTP / auth page
  - `app/paths/page.tsx` — user paths dashboard
  - `app/paths/[pathId]/page.tsx` — path board
  - `app/paths/[pathId]/settings/page.tsx` — path admin settings
  - `app/paths/[pathId]/approvals/page.tsx` — join approval queue
  - `app/api/` — API handlers for path actions and platform actions
- `components/` — reusable UI components like `PathBoard`, `ApprovalsPanel`, `CreatePathForm`
- `lib/` — shared application logic
  - `lib/auth.ts` — session and platform-admin helpers
  - `lib/path-auth.ts` — path role authorization helpers
  - `lib/api.ts` — shared fetch wrapper for API clients
  - `lib/supabase/` — browser and server Supabase clients
- `types/database.ts` — database type definitions
- `docs/` — product, architecture, API, and development docs
- `designDocs/` — design materials and schema references
- `public/` and `styles/` — static assets and theme files

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth + PostgreSQL
- `@supabase/ssr` for cookie-based browser sessions
- CSS custom properties / theme system
- No Express dependency in the repo

## Architecture Rules

### App Router conventions

- Use the `app/` directory for pages and route handlers.
- Route handlers live under `app/api/.../route.ts`.
- Use `GET`, `POST`, `PATCH`, and `DELETE` handlers in Next.js route files.
- Do not assume Express-style request handlers or `req/res` patterns from a Node server.

### Auth and authorization

- Authentication is Supabase-based.
- Path-level permissions must be checked server-side.
- Do not trust only client-side UI state for authorization.
- Role checks should use helper logic from `lib/path-auth.ts` and `lib/auth.ts`.
- Keep tenant scope in `path_id`.

### Data access pattern

- Prefer project utilities in `lib/` and Supabase helpers in `lib/supabase/`.
- Reuse shared fetch logic when speaking to API endpoints.
- Keep platform-level and path-level concerns clearly separated.

## Project Setup

### Prerequisites

- Node.js 22+ recommended
- npm
- Supabase project
- Database schema from project design materials, such as the canonical `phase1-schema.sql`

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Validate

```bash
npm run build
npm run lint
```

## Environment Variables

Create a `.env.local` file in the project root. Use the project README as the canonical reference for required values.

Typical values include:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret-key
```

Important:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Do not prefix server secrets with `NEXT_PUBLIC_`.
- Keep local configuration out of git.

## Coding Conventions

### General

- Prefer minimal, targeted edits over broad rewrites.
- Keep the app-router and route-handler conventions already used in the repo.
- Match the existing project structure instead of creating new generic folders that do not exist.
- Keep features scoped to the correct tenant/path boundary.

### Files and imports

- Use TypeScript files (`.ts`, `.tsx`) in the repo.
- Use consistent path-aware imports.
- Do not assume `src/` exists unless it is clearly part of the actual structure.

### Route and API work

- Add or edit route handlers in `app/api/.../route.ts`.
- Use Next.js route conventions, not Express.
- Keep authorization and data validation inside the request handler.
- Return consistent JSON responses and status codes.

## Key Files to Know

- `package.json` — scripts and dependencies
- `README.md` — canonical project overview and setup instructions
- `AGENTS.md` — durable project memory and planning context
- `app/page.tsx` — public landing/wall page
- `app/auth/page.tsx` — auth experience
- `app/paths/page.tsx` — user paths dashboard
- `app/paths/[pathId]/page.tsx` — main path board interface
- `app/api/paths/.../route.ts` — path-scoped APIs
- `lib/auth.ts` — platform auth helpers
- `lib/path-auth.ts` — per-path access checks
- `lib/api.ts` — app-wide API wrapper
- `lib/supabase/client.ts` and `lib/supabase/server.ts` — Supabase access
- `types/database.ts` — DB model shape

## Common Tasks

### Adding a page

Create or update a route inside `app/` using the Next.js App Router pattern. For example:

- `app/paths/[pathId]/page.tsx`
- `app/paths/[pathId]/settings/page.tsx`

Use server components or client components appropriately, following the repo’s existing patterns.

### Adding or editing API routes

Place new handlers under `app/api/.../route.ts` and follow the project’s route pattern.

Examples:

- `app/api/paths/route.ts`
- `app/api/paths/[pathId]/route.ts`
- `app/api/paths/[pathId]/leaderboard/route.ts`

Use `NextResponse` and standard route-handler patterns, not Express middleware patterns.

### Updating path-scoped behavior

When a feature depends on a specific learning path, check the path-scoped authorization logic and keep operations constrained to the relevant `path_id`.

## Troubleshooting

### Common issues

- Route or page not found: confirm the file is under the correct `app/` path
- Build/type errors: check TypeScript and Next.js conventions
- Auth errors: verify Supabase env variables and session setup
- Permission issues: check path-role logic in `lib/path-auth.ts`
- API failures: inspect the route handler and verify request shape and auth tokens

### Debugging advice

- Read the project docs in `docs/` before changing architecture
- Inspect route files near the failing feature before broad edits
- Use the repo’s actual scripts from `package.json` to validate changes
- Keep changes aligned with the app-router and Supabase architecture, not generic templates

## Documentation to Use

Prefer the repo docs in this order:

1. `README.md`
2. `docs/architecture.md`
3. `docs/api.md`
4. `docs/development.md`
5. `docs/database-operations.md`
6. `designDocs/`

These are the source of truth for architecture and behavior.

## Important Constraints

- This is not a `src`-based project.
- This is not an Express project.
- Path-specific data and authorization must remain isolated.
- Platform-wide admin features and path-scoped features must be treated separately.
- The local engine should prefer the repo’s actual files and conventions over generic Next.js assumptions.

## Summary for the Local AI Engine

When generating or editing code in this repository, assume the following:

- App Router Next.js app
- TypeScript + React 19
- Supabase auth and database
- Multi-tenant path-first architecture
- Files live under `app/`, `components/`, `lib/`, `types/`, and `docs/`
- API routes are in `app/api/.../route.ts`
- Authorization and tenant scoping are required for all path-sensitive operations

This is the correct operating context for understanding and contributing to the project.