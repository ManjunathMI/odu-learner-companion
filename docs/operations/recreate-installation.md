# Recreate ODU for a new installation

The repository includes the application database definition, incremental upgrades, and a repeatable owner-bootstrap script. Article text stays in Git. Supabase Auth configuration and hosting environment settings are external configuration and must be completed for each installation.

## Choose the correct database path

| Situation | Scripts to run |
|---|---|
| New, empty Supabase project | Run docs/DB-schema.sql once, top to bottom. It already contains all tracked upgrades, including account suspension and tracked invitations. Do not then replay those migrations. |
| Existing installation at the pre-launch baseline | Apply the tracked migrations below, in order, after reviewing migration history. |
| Current hosted ODU project | Verify installed features and migration history instead of blindly rerunning scripts. |

The migration directory is an incremental upgrade set, not a complete Supabase CLI db-reset history. Do not use db reset expecting it to create core tables. The full installation entry point is docs/DB-schema.sql. A fresh Supabase project already supplies auth.users, auth.uid(), auth.role(), and built-in roles. This script is not a replacement for installing the Supabase platform on bare Postgres.

## Tracked upgrades

1. supabase/migrations/20261028140510_launch_data_safety.sql: revisioned atomic curriculum writes, note privacy, browser-write restrictions and indexes.
2. supabase/migrations/20261028141705_curriculum_conflict_response.sql: stale-write HTTP 409 semantics.
3. supabase/migrations/20261029121526_document_catalog.sql: metadata-only article catalogue and initial reviewed publication settings.
4. supabase/migrations/20261029182558_learning_material.sql: optional course/day Markdown and curriculum RPC support.
5. supabase/migrations/20261031123616_feedback_requests.sql: feedback requests.
6. supabase/migrations/20261126100000_account_suspension.sql: reversible account suspension, audit events, and access enforcement.
7. supabase/migrations/20261127100000_path_invitations.sql: invitations, delivery attempts, and authorized reporting.

Install the suspension migration before deploying or running the app against an existing project. The app requires both `public.account_suspension_events` and `public.current_account_is_active()` for signed-in access. A missing migration can surface as HTTP 503 when the app checks account access. If you applied it in SQL Editor, confirm the objects exist before recording the migration as applied in any separately maintained CLI history.

The historical baseline already includes creator entitlements, quota requests, profiles, badges, membership policies and creator membership triggers. For an older or unknown database, inspect its actual structure and prepare a separate migration plan; do not treat these files as a universal upgrade for any schema.

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

## Enable invitation email

Install the invitations migration before enabling email on an existing project. Then verify a sender domain with your provider and configure the Vercel server environment using the variables in `.env.example`:

- `NOTIFICATION_EMAIL_PROVIDER` accepts `resend`, `brevo`, or `disabled`.
- `NOTIFICATION_EMAIL_FROM` is the verified sender address. `NOTIFICATION_EMAIL_FROM_NAME` optionally sets the sender’s display name.
- `NOTIFICATION_EMAIL_API_KEY` is a server-side API key. The Resend adapter also accepts `RESEND_API_KEY` supplied by the Vercel integration.
- `PATH_INVITATION_SECRET` is a server-only random secret of at least 32 characters. Keep it stable across redeployments. Changing the secret leaves issued claim links usable until expiry, but prevents reminders for invitations created with the previous secret.
- `NEXT_PUBLIC_BASE_URL` must point to the intended app origin. In production use the canonical HTTPS origin and keep it in the Supabase Auth redirect configuration.

The notification sender and Supabase Auth email configuration are independent. Verify with synthetic recipient accounts before enabling live invitations. Send, accept with the invited account, then request and approve membership. Test a wrong-account claim and use a previously sent fixture older than 24 hours to verify reminder behavior. Verify the results in My Invitations and Platform Admin. An unconfirmed provider outcome may have sent an email. Check provider activity before any manual recovery.

## Documents and QA users

Build/development startup generates the article manifest. The installer seeds the original reviewed articles; any additional Markdown sources register as restricted drafts on catalogue access. Removed-source rows are retained but not served. Publishing metadata can be maintained from the owner workspace; no website action writes Git files.

QA Auth users are intentionally not copied from production by the installer. The owner can create synthetic accounts in Admin. These use admin-controlled app_metadata.role=test, qa_delivery_email and qa_enabled; they start with no path memberships or platform privileges. Assign test roles deliberately in an isolated project. QA link forwarding and permanent deletion remain unfinished and are not made functional by recreating the database.

## Verification

npm test independently exercises the full installer without later migrations and the baseline-plus-upgrades path. Both cover stable lesson IDs, progress/notes preservation, rollback, HTTP 409 conflicts, private notes, quotas, role boundaries, and suspension/restoration with an existing authenticated identity. Additional tests verify catalogue defaults, browser grants, source discovery and owner bootstrap. PGlite tests mock Supabase Auth roles/functions; they do not prove hosted SMTP, Auth settings or backup restore.

Run npm run lint, npm test and npm run build. Then complete the signed-in learner and owner checks in the release checklist against the actual new project before publishing it.


## Optional starter courses for a fresh or white-label installation

After the schema and owner bootstrap, optionally install AI 101 and/or Python Foundations using [supabase/seeds/README.md](../../supabase/seeds/README.md). Set the new installation's verified owner identity and explicit course confirmation before executing each complete seed. New courses remain private/pending review until normal publication approval. These are content seeds, not automatic migrations. Normal application redeployment requires no course import. Never execute the archived original Python SQL against a different installation.
