# ODU Learner Companion Project Guide

This repository is a Next.js 16 App Router application using TypeScript, React 19, and Supabase Auth/PostgreSQL. It is not an Express application and it does not use a `src/` directory.

## Product Direction

ODU Learner Companion is a collaborative learning companion for students, working professionals, and lifelong learners.

Primary message: **Learn anything. Together.**

Core proposition: **You do not have to learn alone.**

The core journey is:

```text
Discover -> Choose a learning goal -> Join/create a Learning Space
-> Learn -> Collaborate -> Practice -> Track progress -> Reflect -> Grow
```

A Learning Space is a user-facing concept around an existing `learning_paths` tenant. Do not create a second `learning_spaces` tenant hierarchy unless explicitly requested.

## Canonical Documentation

Use the repository documentation as the source of truth:

1. `README.md` — product overview, setup, and implementation direction
2. `docs/business-guide.md` — product vision, terminology, roles, workflows, and business rules
3. `docs/architecture.md` — system architecture, tenant model, information architecture, authorization, and UI architecture
4. `docs/api.md` — API contracts
5. `docs/development.md` — local development and database setup
6. `docs/database-operations.md` — database operations
7. `docs/roadmap.md` — phased delivery plan

Do not create duplicate product or architecture documents for an existing decision. Update the canonical document instead.

## Repository Reality

```text
app/                       Next.js routes and API handlers
components/                Reusable UI/domain components
lib/                       Auth, authorization, API, and Supabase helpers
types/database.ts          Database model types
docs/                      Canonical documentation
public/                    Static assets
styles/                    Existing styling/theme files
AGENTS.md                  Durable project memory
```

Important current routes include:

- `app/page.tsx` — public homepage/discovery/wall experience
- `app/auth/page.tsx` — authentication
- `app/paths/page.tsx` — existing paths dashboard / compatibility surface
- `app/paths/[pathId]/page.tsx` — Learning Space/path board
- `app/paths/[pathId]/settings/page.tsx` — creator/path settings
- `app/paths/[pathId]/approvals/page.tsx` — membership approvals
- `app/admin/page.tsx` — platform admin workspace
- `app/api/...` — server API route handlers

Preferred future product routes are `/explore` for discovery and `/journey` for the personal learning dashboard. Keep existing `/paths` functionality working while these experiences are introduced.

## Technology Rules

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth + PostgreSQL
- `@supabase/ssr` for browser sessions
- Native `fetch` API patterns already used by the repository
- Existing Tailwind/PostCSS/CSS custom-property stack
- Do not introduce another UI framework for ordinary product work.

Before writing code for unfamiliar Next.js 16 behavior, read the relevant installed Next.js documentation under `node_modules/next/dist/docs/` as required by `AGENTS.md`.

## Architecture Rules

### Tenant model

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

Every path-owned operation must remain scoped by `path_id`.

### Authorization

Use the existing path-aware authorization helpers and server-side checks. Do not trust client-side UI state for authorization.

Platform-admin operations and path-scoped operations must remain deliberately separate. A UI term such as Learning Space must never imply permissions beyond the underlying role model.

### Authentication

- Browser Supabase client: `lib/supabase/client.ts`
- SSR/server clients: `lib/supabase/server.ts`
- Caller resolution: `lib/auth.ts`
- Session refresh/protection: `proxy.ts`
- API handlers must authenticate independently because the APIs are designed for future mobile clients.

## Product UX Rules

- Public experience should be discovery-first, not administration-first.
- The homepage should clearly communicate “Learn anything. Together.”
- Make the learner's next useful action obvious.
- Use Learning Space as the collaborative experience around a Learning Path.
- Use My Journey for the learner's personal goals, active spaces, progress, next action, and notes.
- Build reusable components and design primitives rather than page-specific styling.
- Prefer a calm, modern, structured, motivating, trustworthy visual language.
- Avoid excessive gradients, glassmorphism, neon/glow effects, stock imagery, and decorative dashboards.
- Responsive behavior and accessibility are first-class requirements.
- Do not display future functionality as if it already exists.

## AI Boundary

AI Companion is a planned supporting capability. Candidate actions include explaining topics, quizzes, learning-plan generation, knowledge-gap identification, and next-step suggestions.

Never present an AI capability as implemented until the corresponding backend exists. AI must not silently modify learning plans or learner records.

## Step-by-Step Implementation Protocol

For every requested change:

1. Read the relevant canonical docs and inspect the existing implementation.
2. State the smallest sensible implementation scope.
3. Identify affected routes/components and whether APIs are actually required.
4. Preserve database, RLS, auth, API contracts, and tenant boundaries unless explicitly asked to change them.
5. Implement only the requested slice.
6. Reuse existing components, helpers, and APIs where practical.
7. Check loading, empty, error, success, responsive, and accessibility states when relevant.
8. Run:

```bash
npm run lint
npm run build
```

9. Summarize changed files, verification results, and any follow-up work.
10. If the change creates a new durable architectural/product decision, update the appropriate canonical doc.

## Product Roadmap Boundary

The immediate priority is the Product Experience phase:

1. Homepage/discovery modernization.
2. `/explore` discovery experience.
3. `/journey` learner dashboard.
4. Learning Space UX refinement.
5. Reusable responsive/accessibility system.

Later phases cover creator/community features, AI Companion, engagement, production readiness, and mobile. Do not implement later-phase functionality simply because it is listed in the roadmap.

## Important Constraints

- No Express patterns.
- No `src/` directory assumptions.
- No duplicate documentation for existing decisions.
- No second tenant hierarchy for Learning Spaces.
- No unrequested database/schema/RLS changes during UI work.
- No fake metrics or unimplemented feature claims.
- No client-only authorization.
- Keep changes focused and reviewable.
