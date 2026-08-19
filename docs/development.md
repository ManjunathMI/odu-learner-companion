# Development Guide

## Prerequisites

- Node.js 22 or later is recommended by current Supabase packages.
- npm
- A Supabase project
- The canonical `phase1-schema.sql` file

## Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. If port 3000 is already occupied, use the existing server or stop it before starting another one.

For a production build:

```bash
npm run build
npm run start
```

## Environment Variables

Create `.env.local` in the repository root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-server-only-secret-key
```

`SUPABASE_SERVICE_ROLE_KEY` must never use a `NEXT_PUBLIC_` prefix. Never commit it or expose it to browser or mobile code.

`ADMIN_USER_IDS` is not the canonical role mechanism for the multi-tenant platform. Path roles belong in `path_memberships`; platform administrators belong in `platform_admins`.

## Database Setup

The Supabase project should remain empty until the application and schema are aligned. Run the canonical `phase1-schema.sql` from top to bottom in Supabase SQL Editor. Do not run legacy single-room schemas or old setup documents.

After signing up once, insert the first platform admin manually if needed:

```sql
insert into platform_admins (user_id)
select id from auth.users where email = 'your-email@example.com';
```

To verify the creator trigger:

1. Sign in to the app.
2. Create a learning path.
3. Inspect `path_memberships` in Supabase.
4. Confirm your row has `role = 'admin'` and `status = 'approved'`.

## Useful Checks

```bash
npm run build
npm run lint
```

For API checks after the schema is installed:

```bash
curl http://localhost:3000/api/wall
```

An empty `[]` is a valid response before any public approved paths exist.

## Contribution Workflow

1. Fork the repository.
2. Create a focused branch.
3. Keep changes aligned with `path_id` tenant scoping.
4. Do not commit `.env.local` or `designDocs/`.
5. Run the build before opening a pull request.
6. Include API and authorization behavior in the pull request description.

## Production Notes

- Configure environment variables in the hosting provider, not in source control.
- Use a separate Supabase project for staging and production.
- Rotate service-role keys if they are ever exposed.
- Add monitoring and database backups before a production launch.
