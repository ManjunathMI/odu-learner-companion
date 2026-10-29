# ODU Learner Companion

**Learn anything. Together.**

ODU helps students, professionals and lifelong learners discover Learning Paths, join shared Learning Spaces, follow resources, track progress and keep Personal Notes. Learners can also create paths for their own goals or groups. AI assistance and richer community features remain planned.

## Run locally

Use Node.js 22 or later and npm. Configure .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_BASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY. Never commit credentials.

```bash
npm ci
npm run dev
```

Use a separate Supabase project for development/staging where possible. Follow the [development guide](docs/engineering/development.md) for database setup and email redirects.

## Documentation

- [Learner guides](content/help/how-to-use.md), [About ODU](content/about/about-odu.md), and [blog articles](content/blog/learning-together.md) are website content.
- [Engineering and product index](docs/README.md) links architecture, API, operations and planning documents.
- [Publishing workflow](docs/decisions/content-publishing.md): Markdown stays in Git; the owner manages website visibility in Admin. Technical website articles require platform-admin access.
- [Deployment](docs/operations/deployment.md) and [release checklist](docs/operations/release-checklist.md).

## Validation

```bash
npm run lint
npm test
npm run build
```

Build and development startup generate the document manifest automatically. New Markdown sources register as drafts when the deployed catalogue is loaded. The website does not edit or commit files.

## Distribution

A project license has not yet been selected. Choose one before distributing the code under a license grant.

## Architecture

Next.js App Router, React, TypeScript and Supabase. learning_paths is the tenant root; path roles remain separate from platform administration. API handlers authenticate independently and enforce path-scoped authorization. PostgreSQL grants and RLS protect direct database access.
