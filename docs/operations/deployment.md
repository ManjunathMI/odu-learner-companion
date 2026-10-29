# Deployment and recovery

Deploy the application and its Git-backed Markdown together. Runtime publishing settings live in document_catalog and are not part of a Git rollback.

## Environment

Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_BASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY in Vercel. NEXT_PUBLIC_BASE_URL must be the canonical production origin for metadata and sitemap URLs. Never expose the service key through NEXT_PUBLIC variables. For a new installation, also set both PLATFORM_OWNER_ID and PLATFORM_OWNER_EMAIL using the verified Auth user, as described in the [recreation guide](recreate-installation.md).

## Before deployment

1. Review the [release checklist](release-checklist.md).
2. Apply only the reviewed additive migrations needed by this release. Do not rerun docs/DB-schema.sql against an existing project.
3. Run lint, the retained offline tests and a production build.
4. Verify new document entries and their intended audiences. Initial starter articles are seeded by the catalogue migration; future sources default to restricted drafts.
5. Confirm a known good deployment can be promoted if rollback is necessary.

## Deploy

Import the application repository in Vercel with the Next.js preset. Build uses npm run build, which generates the Markdown manifest first. The build must include content/, docs/, and the manifest-generation scripts. next.config.ts traces Markdown sources into server output; .vercelignore must not exclude these files. Git-host integration and deployment permissions are configured in the hosting dashboard; do not assume a push deploys unless that integration is verified.

## Email configuration

Keep the Supabase Site URL on production. Allow the production /auth/callback URL and the localhost development origins actually used. The app sends its current origin in emailRedirectTo. The Magic Link template should use ConfirmationURL; include Token when offering typed codes. Request fresh links after changing configuration, and open PKCE links in the browser that requested them.

## Verify production

Check email sign-in, My Journey, public discovery, private-space boundaries, progress and note persistence, and owner Admin access. Check that public articles have canonical metadata and sitemap entries, while technical articles return no content for visitors and ordinary learners. Save/unpublish a reviewed article and verify the resulting access with a separate visitor session.

## Rollback

Promote the previous verified Vercel deployment. Database schema and publication settings require their own reviewed recovery steps. A code rollback does not revert database changes; additive migrations should remain compatible with the release being restored. Missing-source catalogue rows remain historical and are not served.

## Backups

Supabase db pull captures schema, not a data backup. Use a database backup/export method appropriate to the project's plan and verify restore into an isolated environment. Document the last successful restore, recovery owner and retention. Never claim backup readiness from an untested command. Check the current provider's backup capabilities before relying on them.

## Monitoring

Review Vercel runtime errors and Supabase Auth/database logs. Assign an operator to membership/publication queues. Review response latency, First Contentful Paint, Largest Contentful Paint and Cumulative Layout Shift in the monitoring tools actually configured for the deployment. Do not log access tokens, sign-in URLs, service keys or private note text.
