# Recreate ODU for a new installation

The repository includes the application database definition, incremental upgrades, and a repeatable owner-bootstrap script. Article text stays in Git. Supabase Auth configuration and hosting environment settings are external configuration and must be completed for each installation.

## Choose the correct database path

| Situation | Scripts to run |
|---|---|
| New, empty Supabase project | Run docs/DB-schema.sql once, top to bottom. It already contains current hardening, curriculum conflict handling and document_catalog. Do not then replay the catalogue migration. |
| Existing installation at the pre-launch baseline | Apply the three tracked migrations below, in order, after reviewing migration history. |
| Current hosted ODU project | These three changes are already applied. Verify history instead of blindly rerunning them. |

The migration directory is an incremental upgrade set, not a complete Supabase CLI db-reset history. Do not use db reset expecting it to create core tables. The full installation entry point is docs/DB-schema.sql. A fresh Supabase project already supplies auth.users, auth.uid(), auth.role(), and built-in roles. This script is not a replacement for installing the Supabase platform on bare Postgres.

## Tracked upgrades

1. supabase/migrations/20261028140510_launch_data_safety.sql: revisioned atomic curriculum writes, note privacy, browser-write restrictions and indexes.
2. supabase/migrations/20261028141705_curriculum_conflict_response.sql: stale-write HTTP 409 semantics.
3. supabase/migrations/20261029120712_document_catalog.sql: metadata-only article catalogue and initial reviewed publication settings.

The historical baseline already includes creator entitlements, quota requests, profiles, badges, membership policies and creator membership triggers. For an older or unknown database, inspect its actual structure and prepare a separate migration plan; do not treat these three files as a universal upgrade for any schema.

## Create the installation owner

1. Configure public project keys and the server-only service key using .env.example as a template.
2. Configure Supabase email delivery and redirect URLs, then sign in with the intended owner's real email. Do not insert fabricated Auth rows or passwords with SQL.
3. In one SQL Editor session, run the setting shown at the top of supabase/setup/platform-owner.sql and then run that file. It requires a confirmed Auth email and idempotently adds platform_admins membership.
4. Set both server environment variables PLATFORM_OWNER_ID and PLATFORM_OWNER_EMAIL to that verified user. Restart/redeploy the app. Supplying only one value fails closed. Legacy defaults preserve the original ODU installation but must not be relied on for a new project.

Do not copy another project's owner UUID. Platform-admin membership alone grants technical-document read access; owner identity is additionally required for Admin management.

## Configure the external services

- NEXT_PUBLIC_BASE_URL: canonical production origin for SEO and sitemap links.
- Supabase Site URL and allowed callback URLs: production plus the development origins actually used.
- Auth email templates: ConfirmationURL and optional Token for typed codes.
- SMTP: choose/configure the project's provider and verify actual delivery. Credentials are never included in Git.
- Vercel: environment variables, build command and Git integration.
- Backup/restore, monitoring and operational ownership: verify separately; database installation does not configure them.

## Documents and QA users

Build/development startup generates the article manifest. The installer seeds the original reviewed articles; any additional Markdown sources register as restricted drafts on catalogue access. Removed-source rows are retained but not served. Publishing metadata can be maintained from the owner workspace; no website action writes Git files.

QA Auth users are intentionally not copied from production by the installer. The owner can create synthetic accounts in Admin. These use admin-controlled app_metadata.role=test, qa_delivery_email and qa_enabled; they start with no path memberships or platform privileges. Assign test roles deliberately in an isolated project. QA link forwarding and permanent deletion remain unfinished and are not made functional by recreating the database.

## Verification

npm test independently exercises the full installer without later migrations and the baseline-plus-upgrades path. Both cover stable lesson IDs, progress/notes preservation, rollback, HTTP 409 conflicts, private notes, quotas and role boundaries. Additional tests verify catalogue defaults, browser grants, source discovery and owner bootstrap. PGlite tests mock Supabase Auth roles/functions; they do not prove hosted SMTP, Auth settings or backup restore.

Run npm run lint, npm test and npm run build. Then complete the signed-in learner and owner checks in the release checklist against the actual new project before publishing it.
