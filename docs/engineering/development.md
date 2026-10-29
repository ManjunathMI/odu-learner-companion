# Development Guide

## Prerequisites

- Node.js 22 or later is recommended by current Supabase packages.
- npm
- A Supabase project
- The canonical `docs/DB-schema.sql` file

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

For a new empty project, run the canonical `docs/DB-schema.sql` from top to bottom in Supabase SQL Editor. For an existing project, apply only reviewed additive migrations in supabase/migrations/. Do not run legacy single-room schemas or old setup documents.

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
npm test
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

`npm test` uses an in-memory PGlite PostgreSQL instance with synthetic auth roles. It covers additive migration replay, curriculum rollback and data preservation, stale edits, direct-write restrictions, quotas, and note privacy. It does not require Supabase credentials. Real Supabase/PostgREST and email delivery acceptance checks remain separate.

For an explicitly authorized live API acceptance check, first run the local production build on port 3100, then run `ODU_RUN_LIVE_API_TESTS=1 node scripts/check-local-api.mjs`. This opt-in script uses the configured Supabase project, creates two disposable synthetic auth users and one private path, tests real API handlers, and removes only those fixtures in `finally`. It does not test email delivery or render authenticated browser UI. Never run it against a different project without reviewing the target environment. Keep service-role credentials in the environment, not arguments or logs.

## Local Sign-In and Existing QA Accounts

The current sign-in form sends `emailRedirectTo` using the browser's actual origin, with `/auth/callback` and a safe internal continuation. The callback exchanges the PKCE code (normal email links) or verifies an email token hash (explicit CLI-generated QA links), sets the normal Supabase SSR session cookies, and redirects to Journey or the selected Learning Space. Invalid/expired links return to sign-in with a generic error. Codes/tokens are never included in error messages or committed artifacts.

For real email login while developing:

1. Keep the Supabase **Site URL** set to the production application.
2. In **Authentication → URL Configuration → Redirect URLs**, allow `http://localhost:3000/**` and `http://localhost:3100/**` for the local ports actually used. Use exact production callback URLs for production. The current MCP connection exposes database/log/advisor tools, but no Auth configuration read/update tool; these allowlist/template settings still need verification in the dashboard.
3. The Magic Link email template should use `{{ .ConfirmationURL }}` rather than a hardcoded production link. To also provide a typed OTP, include `{{ .Token }}` in the template. The form accepts 6–10 digits.
4. Request a **new** link from the local app after saving the allowlist. Previously sent production links retain their old destination. PKCE links must open in the browser that requested them.
5. An email-rate-limit error is independent of redirects. A 429 appeared during this review; use the QA helper for repeated tests and verify production SMTP/rate-limit configuration separately.

References: [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [redirect URL rules](https://supabase.com/docs/guides/auth/redirect-urls).

### Verify the Actual Hosted Redirect Choice

On 28 October 2026 a no-email `generateLink` diagnostic explicitly requested `http://localhost:3100/auth/callback?next=%2Fjourney`; hosted Supabase selected `https://odu-learner-companion-j86o.vercel.app/` instead. This confirms the localhost callback was not accepted by the deployed redirect configuration at the time of the check. The local form already supplies the correct current-origin callback. The Outlook wrapper was not opened or consumed.

After updating Authentication → URL Configuration → Redirect URLs, run:

```bash
npm run test:redirects -- http://localhost:3100
```

The retained script uses only the existing visitor QA account, sends no email, and prints requested/selected destinations without tokens. It exits nonzero if Supabase still falls back to production. It generates a fresh one-time QA token, so older unused visitor QA links may become invalid. A passing result verifies redirect acceptance, not email-template rendering or SMTP delivery. Keep the production Site URL; allow localhost as an additional redirect rather than replacing Site URL. Request a fresh real email link from the same browser afterward.

### No-email QA Login

The `@odu.local` addresses are seeded synthetic identities marked with admin-controlled `app_metadata.role = "test"`. `/auth` supports email links and codes only; password sign-in is not offered. These synthetic addresses cannot receive email directly. QA delivery-email settings are managed under the owner-only admin workspace, but forwarding still needs its delivery integration. The CLI helper below remains optional for automated/debug workflows. Existing passwords are not reset. Changing the setup/authentication model of these accounts, the database schema, or major architecture requires explicit user approval.


These existing synthetic users were verified in Supabase Auth. Account names do not determine permissions:

| Persona | Email | Current approved membership |
|---|---|---|
| visitor | visitor.test@odu.local | None |
| learner | learner.test@odu.local | None |
| moderator | moderator.test@odu.local | None |
| pathadmin | pathadmin.test@odu.local | Admin of Cloud Foundations Bootcamp |
| superadmin | superadmin.test@odu.local | Platform Admin; no path membership |

Cloud Foundations currently has no curriculum. Learner/moderator role-specific path testing requires an explicit, separate fixture setup; merely signing into those named accounts does not exercise those roles. Do not silently assign roles to make a test pass.

There is **no active offline/mock-login bypass** in the application. The unused legacy LoginForm component was removed during release cleanup; components/AuthForm.tsx is the active email-only sign-in form. The helper below avoids sending emails but still uses real Supabase Auth, SSR cookies, server authorization, and RLS. It does not reset passwords or create users. Its allowlist excludes personal accounts and its destination is restricted to loopback origins.

```bash
# Start the application on the same origin used below.
npm run test:login -- learner http://localhost:3100
```

Open the generated `.local/test-login/learner.html` file in your regular browser and follow its link. Substitute `visitor`, `moderator`, `pathadmin`, or `superadmin` as needed. Each link is single-use and expires; regenerate it for another sign-in. Generated links are credentials and remain in ignored files with restricted permissions. Do not share them or put them in issue reports. The helper is a local CLI script, not an HTTP backdoor or a deployed feature.

### Growing Regression Suite

Keep and extend the existing files in `tests/` and `scripts/`; add cases for each new behavior or bug rather than replacing the suite.

```bash
npm test                # Offline database and authentication regression tests
npm run check           # lint + complete offline suite + production build

# Opt-in integration tests against the configured Supabase project:
ODU_RUN_LIVE_API_TESTS=1 npm run test:api
ODU_RUN_EXISTING_ACCOUNT_TESTS=1 npm run test:accounts -- http://localhost:3100
```

`test:api` creates/cleans disposable fixtures; `test:accounts` signs into the five existing QA identities, checks SSR cookies/Journey/account/platform boundaries, and does not change their memberships or learning records. Both are retained. CI runs the offline suite on each push/PR; live checks deliberately require explicit opt-in and server credentials. A fully rendered browser Journey check remains distinct from an HTTP route/API check. During the 28 October review, all five existing QA identities were also checked in the browser, including path-admin settings and the super-admin directory. The signed-in header was checked at 390px and corrected to avoid horizontal overflow. No memberships, curricula, progress, notes or passwords were changed by these existing-account checks.

### Git Boundary

Commit application code, tests and safe test utilities, database migrations, package lockfile, canonical documentation, CI workflows, and shared repository instructions (`AGENTS.md` and the reusable GitHub prompt). Do not commit downloaded `.agents/` skills, connector/MCP files, private `.env*`, local Claude/Continue/Codex/editor settings, generated login/session artifacts, test reports, or Supabase CLI temporary/branch state. `.gitignore` and `.vercelignore` encode this split. Previously tracked Continue, VS Code, and Claude integration files were removed from Git's index while preserving local copies. Adding an ignore pattern alone does not untrack an existing file.

### Admin diagnostics and QA management (2026-10-29)

`node scripts/check-admin-access.mjs https://odu-learner-companion-j86o.vercel.app`
uses the existing synthetic platform-admin identity, sends no email, and prints
only endpoint status/counts. It signs out its own diagnostic session in finally.
A production recheck returned 200 for /admin, /api/admin/paths (3 paths), and
/api/admin/quota-requests (2 requests). An earlier paths request timed out; the
original owner-session failure has not been reproduced or attributed to a cause.
Vercel runtime logs from the failure are still needed. No owner impersonation was
used. Local /admin now checks the owner UUID and email plus the platform role;
QA platform admins retain path-level testing privileges but cannot enter the
owner workspace. These changes are not deployed.

The local admin workspace includes a QA management section using existing Auth
users and admin-controlled app_metadata (see database-operations.md). No registry
table or schema migration is required. Login forwarding and permanent deletion are
not complete. Existing passwords have not been reset.

## Content maintenance

See [Git-backed documentation publishing](../decisions/content-publishing.md). New Markdown sources are discovered by prebuild/predev; restart dev after creating a new file. Existing files are read from the deployed Git snapshot. Never put content/ or docs/ under public/.

## Owner verification on 29 October 2026

The owner reported successful localhost email callback, access to the local admin management section, enable/disable of QA accounts, and creation of a new QA account. These are owner-reported local checks, not production deployment evidence.

The retained `scripts/check-documents.mjs` checks public articles and sitemap, rejects technical reads for visitors/learners, permits published technical reads for QA platform admins, and denies catalogue GET/PATCH to non-owner accounts. It uses existing QA sessions only, sends no email and changes no publishing settings. Run with `ODU_RUN_EXISTING_ACCOUNT_TESTS=1 node scripts/check-documents.mjs http://localhost:3100` only when existing-account checks are authorized.
