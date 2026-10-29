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

## AI 101 curated course — offline implementation

The first curated course is defined in curricula/ai-101-beginners/course.json. It contains the original supplied teaching explanations, objectives, practice activities, outcomes, attribution links and optional references. Seven existing phases each contain one day and one required lesson completion item. Path identity and all 21 child IDs are deterministic UUIDs; the descriptive slug stays in Git metadata, while existing /paths/UUID routes and API contracts are unchanged.

### Architecture assessment and reuse

| Capability | Existing maturity | Implementation |
|---|---|---|
| Learning-path creation | Existing | learning_paths, creator trigger, quota RPC and CreatePathForm. |
| Structured course ingestion | Missing reusable importer | A bounded offline SQL generator; no framework or hosted ingestion service. |
| Video resources | Existing URL links; partial rich organization | Existing lesson URLs plus inline Watch links crediting original creators; no video hosting. |
| Reading/reference resources | Existing URL links; partial rich organization | Authoring content is imported into days.content_markdown with Read, Practice and optional References groups. |
| Enrollment | Existing | POST /api/paths/:pathId/join requests pending learner membership; existing moderator approval grants access. |
| Progress | Existing | POST /progress and the unique user/item key; one completion item per day. |
| Leaderboard | Existing | Path-specific approved members ranked by completed current lesson items; no new scoring. |
| Database extensibility | Existing | Existing hierarchy retained; two approved optional Markdown columns, no new table. |

Quick wins reuse PathBoard, JourneyDashboard, the join/approval/progress/leaderboard routes, path_memberships, progress and notes. Bounded changes add a generic LearningContent renderer, optional Markdown fields in Path Settings and the path APIs, and the offline generator/test utilities. New assessment systems, RAG/agents services, scoring, certificates and a general ingestion framework are deferred. The application does not import the course JSON at runtime or special-case the AI 101 UUID.

The existing path-creation RPC does not accept a stable path ID. The trusted development seed therefore checks the same creator lock/quota rule, inserts the fixed-ID path once, reuses the creator membership trigger, and calls save_learning_plan for validated atomic content updates. It locks the path, preserves IDs, skips unchanged curriculum updates, refuses foreign-ID collisions and refuses unconfirmed removals. Only an explicitly selected development platform administrator may publish via --publish. Repeat imports do not rewrite membership, progress or notes. Private re-imports preserve existing publication settings.

### Generate a development import

The agreed scope is offline preparation only. The currently configured hosted project is production; no course was inserted there. The generator never reads credentials or connects to a database.

```bash
npm run course:ai101
npm run course:ai101 -- --owner-id YOUR_DEVELOPMENT_AUTH_UUID --output /tmp/ai101-development.sql --publish
```

Use the confirmed Auth UUID from a separate development project, not a copied production UUID. Omit --publish to create a private pending-review path. The generator refuses to overwrite an existing output file. Review the SQL, then run it only against the isolated development database. In the same SQL session first set:

```sql
set odu.allow_development_seed = 'ai101-local-only';
```

For an explicitly configured development connection, the equivalent operator command is:

```bash
psql "$ODU_DEV_DATABASE_URL" --set ON_ERROR_STOP=1 --command "set odu.allow_development_seed='ai101-local-only'" --file /tmp/ai101-development.sql
```

The confirmation setting is an operator safeguard, not a way for SQL to identify whether a server is production. Never point this command at production. No Auth users or roles are created by the seed; the intended development owner must already exist and have platform-admin membership when publishing.

### Content and completion

Seven modules total 470 minutes (7 hours 50 minutes), within the 7–9 hour estimate. There are 12 core resource links, two optional developer references and six optional library references: 20 distinct URLs, including three videos. All returned HTTP 200 during the recorded check; video titles/authors were also confirmed through public metadata. Reachability is not proof of playback, free access or content suitability. The exact report is curricula/ai-101-beginners/link-checks.json; rerun node scripts/check-ai101-links.mjs --write-results for HTTP reachability checks.

The learner's required action is to work through a day's activities and mark its existing lesson item complete. Current formula: completed items / total items; one day is 1/7, rounded to 14%. Optional resources are not separate lesson items and do not inflate the denominator. Community Progress remains sorted by doneCount. Completing activities is self-reported participation, not verified mastery. External AI-generated practice questions in Day 7 belong to the learner's own prototype; ODU has no new quiz, grading or AI endpoint.

### Offline validation and remaining manual journey

The retained AI 101 tests load the full current schema into PGlite, import twice, exercise pending/duplicate/approved membership, save progress and a note, calculate path-scoped completed-item counts, update content while retaining activity, and reject unintended removals. A separate existing path's curriculum, progress and notes remain unchanged. They also test quota and publication guards. These are offline database-contract tests, not hosted Auth/PostgREST or complete browser acceptance.

### Approved optional content fields

Migration `20261029182558_learning_material.sql` adds nullable `learning_paths.overview_markdown` and `days.content_markdown`. The full installer `docs/DB-schema.sql` includes the same changes for a fresh installation. Apply the migration to an isolated development database before testing these application changes. It has NOT been applied to production. Deploying this code requires that migration first; the metadata API selects the new overview field.

The metadata API returns/saves overviewMarkdown; read_learning_plan and save_learning_plan return/save each day's contentMarkdown. The existing admin authorization, revision check, atomic transaction and removal confirmation remain in force. Older curriculum payloads that omit the new day key preserve stored material; explicit null or an empty string clears it. Both editing fields are limited to 100,000 characters and the existing 1 MiB curriculum request limit still applies.

Path Settings supports these optional Markdown fields. The Learning Space renders overview and individual day material in expandable sections. Raw HTML and embedded images are disabled; resources remain external links. Existing completion items, personal notes and Community Progress use the same IDs and rules. The earlier one-page static course preview was retired: it was not the authenticated Learning Space.

After a safe development import, verify Explore → AI 101 → Request to join → facilitator approval → Learning plan → complete a day → refresh → My Journey → Community Progress. Confirm the learner starts at 0/7, reaches 1/7 after the first completion, and that a second course's progress and leaderboard are unaffected. The entire authenticated browser journey remains unverified until a separate development database is available. The course is not yet present in the production Explore catalogue.

### Production import authorized — 30 October 2026

The owner explicitly approved using production because a separate database is unavailable. The earlier development-only restriction is superseded for this AI 101 installation. Supabase MCP currently fails OAuth refresh, so no production preflight, migration or import has been performed by the agent.

The generator now supports an explicit production mode. It verifies the specified UUID, confirmed Auth email and platform-admin membership before DDL. It wraps the approved optional-field migration, curriculum import, publication and seven-day verification in one transaction. Identity, quota, collision or validation failure rolls back the transaction. Repeated successful imports retain the existing IDs and skip unchanged curriculum saves; existing learner activity remains untouched. It does not grant roles, reset passwords or increase quotas.

```bash
npm run course:ai101 -- --production --owner-id YOUR_CONFIRMED_OWNER_UUID --owner-email YOUR_VERIFIED_OWNER_EMAIL --output /tmp/ai101-production.sql
```

Run the entire generated SQL file in the intended project's SQL Editor. Production mode includes public/approved publication; the separate development confirmation setting is not used. The generated output is an installation artifact, not an additional migration source. It uses the versioned migration and Git curriculum as sources. The repository full installer must not be run on an existing production database.

SQL Editor execution bypasses Supabase CLI migration history. After verifying success, reconcile version 20261029182558 as applied through the CLI migration repair workflow if maintaining remote CLI history; do not mark it applied before the SQL succeeds. The generator does not modify internal Supabase migration tables.

Deploy the matching API/UI changes to see detailed day material. Then verify the actual signed-in learner journey, including progress persistence and path-isolated Community Progress. Production success remains unconfirmed until the SQL has been run and its results checked.

### AI 101 production import review — 30 October 2026

The owner ran the combined SQL installation. A read-only database audit confirmed public/approved publication, matching title/description/tags/overview, revision 1, and exact equality of all seven phases, days, completion items and per-day Markdown against the Git import source. The one-off read-only audit script was removed during pre-push cleanup; the comparison results are preserved here. Reusable import and data-preservation coverage is in tests/database.test.mjs.

An explicitly authorized sign-in as the existing synthetic superadmin.test@odu.local account confirmed that its existing platform-admin override opens AI 101 without joining. The production UI shows the seven day titles/objectives, resource links, notes controls and 0/7 completion; Community Progress opens and shows the owner's 0/7 entry. No completion, notes, membership or curriculum writes were performed during review. Auth sign-in itself updates the QA account's session/sign-in metadata. The one-off production review-login script and its generated credential file were subsequently removed during cleanup. Existing reusable localhost QA tooling remains available; generated login links must never be logged or committed.

The deployed public metadata API still omits overviewMarkdown, and the signed-in page omits both the course overview and all daily rich content. This is consistent with older application code still deployed: the database material is correct, but the corresponding local API/PathBoard/LearningContent changes must be deployed. Do not rerun the import merely to resolve this display gap. Recheck the rich material after deployment, then exercise learner join/approval, completion persistence and notes with a QA learner before declaring full acceptance.

### Web learning-path cleanup — 30 October 2026

The website now uses expandable day cards, opens the next unfinished day initially, and links the progress prompt to the day rather than directly to its completion checkbox. Matching one-day phase/day titles are not repeated. Durations are shown in minutes/hours instead of decimal hours. The course reference library has its own visible disclosure next to the overview. Each open day separates teaching/practice from titled external-resource links, with completion and personal notes below. This is a web presentation change only: no additional schema, tenant, authentication or scoring changes.

Markdown is partitioned using its parsed heading nodes, preserving fenced examples, unknown lesson sections and reference-style link definitions. All stored source content remains available across the lesson/resource and overview/library views. The AI 101 regression tests were consolidated into the existing database suite; the standalone test file, one-off production audit/login scripts, stale preview, generated SQL artifact, screenshot and generated login files were removed. Curriculum JSON, resource verification report, repeatable SQL generator, reusable link checker, canonical installation schema and migration remain versioned for recreation.

Web preview verification: signed in with the existing QA super-admin account on localhost. All 14 daily resource links across Days 1–6 matched the source, all six optional library links were visible, and Day 7 retained its supporting link. Checked accordion navigation, the next-day link and website layouts at 1280px and 390px with no horizontal overflow. Progress remained 0/7; no completion or notes writes were made. Lint, 34 automated checks and TypeScript pass. The production build was not rerun in this cleanup round because its execution permission was declined; earlier build success predates these latest UI edits.
