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

## Execution expectations

- Prefer minimal, targeted edits over broad rewrites.
- Match the existing app-router and route-handler conventions already used in the repo.
- Keep instructions and project context aligned with actual code, not assumptions from generic templates.
- If a fact conflicts with prior memory, update the memory and explain the change clearly.
- Do not lose project continuity between sessions or future agents.

## Verification habit

Before claiming success, verify with the repo’s actual commands. For this project, the default validation path is the scripts in `package.json`, including linting and build steps when relevant. Record the result in the relevant memory location so future work knows what has already been tested.

This repo’s project memory should be treated as living documentation: each new understanding strengthens the next build, the next plan, and the next implementation step.
