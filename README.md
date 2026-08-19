# ODU Learner Companion

ODU Learner Companion is a multi-tenant learning platform for certification journeys, structured learning paths, onboarding programs, and community-led study.

Each learning path is an independent tenant with its own content, members, roles, progress, notes, and leaderboard. Public paths can be listed on the wall after approval; private paths remain visible only to approved members.

## Product Model

- **Visitor:** browses approved public paths.
- **Learner:** studies a path, tracks personal progress, writes notes, and views the path leaderboard.
- **Moderator:** reviews join requests for a specific path.
- **Path admin:** manages one path's metadata, plan, and membership.
- **Platform admin:** handles platform-wide operations such as wall moderation.

Roles are scoped to `path_id`. There is no global path-admin environment flag in the canonical design.

## Main Features

- Supabase email OTP or magic-link authentication.
- Public wall for approved public learning paths.
- User-created learning paths.
- Database trigger that makes a path creator its approved admin.
- Nested plans: phases → days → lesson items.
- Path-scoped membership requests and approvals.
- Progress tracking and leaderboards.
- Notes attached to lesson items.
- Row Level Security and server-side authorization checks.
- API contracts designed for reuse by a future React Native client.

## Technology

- Next.js 16 App Router and Route Handlers.
- React 19 and TypeScript.
- Supabase Auth and PostgreSQL.
- `@supabase/ssr` for browser cookie sessions.
- Native `fetch` API client with Bearer-token support for mobile clients.
- CSS custom properties and the existing theme system.

## Repository Layout

```text
app/
  page.tsx                         Public wall
  auth/page.tsx                    Email OTP authentication
  paths/page.tsx                   User's paths
  paths/[pathId]/page.tsx          Path board
  paths/[pathId]/settings/page.tsx Admin settings
  paths/[pathId]/approvals/page.tsx Approval queue
  api/                             Path-scoped API routes
components/                        Reusable UI components
lib/supabase/                      Browser and server Supabase clients
lib/auth.ts                        Session and platform-admin helpers
lib/path-auth.ts                   Path-role authorization helpers
lib/api.ts                         Cross-client API fetch wrapper
types/database.ts                  Supabase database types
docs/                              Maintained documentation
proxy.ts                            Next.js session refresh and protection
```

## Getting Started

### Prerequisites

- Node.js 22 or later recommended.
- npm.
- A Supabase project.
- The canonical `phase1-schema.sql` supplied with the design materials.

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

Run the canonical `phase1-schema.sql` from top to bottom in Supabase SQL Editor. Do not run legacy single-room schemas. The schema creates the tables, RLS policies, authorization functions, grants, and creator-admin trigger required by this application.

After the first sign-in, a platform admin can be added manually:

```sql
insert into platform_admins (user_id)
select id from auth.users where email = 'your-email@example.com';
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify

```bash
npm run build
npm run lint
```

## Documentation

- [Business guide](docs/business-guide.md)
- [Architecture](docs/architecture.md)
- [Development guide](docs/development.md)
- [API reference](docs/api.md)
- [Browser documentation](http://localhost:3000/docs) while the app is running

## Future Mobile Client

The APIs are path-scoped and do not depend on browser navigation. A React Native client can authenticate with Supabase, store its session using a native storage adapter, send the access token as a Bearer token, and reuse the same `/api/paths/...` contracts.

## Contributing

1. Fork the repository.
2. Create a focused feature branch.
3. Keep every tenant-owned operation scoped by `path_id`.
4. Do not commit `.env.local` or `designDocs/`.
5. Run `npm run build` before opening a pull request.
6. Describe authorization and API behavior in the pull request.

## Contact

For project questions, contact [Manjunath Islampure on LinkedIn](https://www.linkedin.com/in/manjunath-islampure/).

## License

Add the project's chosen license before public distribution.
