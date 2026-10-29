# Product Roadmap

This roadmap is the canonical planning document for ODU Learner Companion. It evolves the existing learning-tracker foundation into a collaborative learning companion for students, working professionals, and lifelong learners.

## Product Direction

**Primary message:** Learn anything. Together.

**Core proposition:** You do not have to learn alone.

The product journey is:

```text
Discover
   -> Choose a learning goal
   -> Join or create a Learning Space
   -> Learn
   -> Collaborate
   -> Practice
   -> Track progress
   -> Reflect
   -> Grow
```

A Learning Space is currently a product/UX concept around the existing `learning_paths` tenant. It does not require a new `learning_spaces` database table at this stage.

## Current launch status — 29 October 2026

Owner-reported local checks confirm email-link callbacks return to localhost, and QA-account creation plus enable/disable work in Admin. The login form is email-only. QA login forwarding and permanent deletion remain unfinished. The documentation reorganization passes lint (two pre-existing image warnings), 17 offline tests and a production build. Read-only existing-account acceptance checks verified public article/sitemap access, learner denial, platform-admin technical reading and owner-only catalogue management boundaries. Desktop/mobile reading and heading highlighting were checked. Owner publication controls still need a signed-in owner check. Production Admin endpoints passed a recheck, but the original intermittent owner failure has not been attributed to a cause.

Documentation is consolidated into Git-backed public content and protected engineering/product guides. Publishing metadata is managed through the owner workspace; source creation/editing remains a Git workflow. Earlier assessments below are historical evidence, not a live list of unresolved issues.

## Foundation and assessment history

### Launch assessment — 28 October 2026

Repository review confirms that identity/account, Explore, Journey, the guided curriculum editor, member management, publication review, and transactional creator-quota RPCs already exist. Older agent notes and some public documentation still describe delivered work as future work. Implementation presence is not evidence that the deployed database, email delivery, or complete user journeys have been verified.

The shortest useful launch is a focused beta: discover a curated path, sign in, request membership, receive facilitator approval, follow resources, save progress and private notes, and return to continue. Begin with a small set of complete paths and an actively managed learner group. AI, badges, payments, native mobile, and a broad community layer are not prerequisites. Move the production-readiness work below ahead of those expansions.

#### First launch-fix implementation — 28 October 2026

Implemented locally and database migration applied (`20261028140510_launch_data_safety`):

- Curriculum now uses atomic service-only RPCs, retains lesson IDs, rejects stale revisions, validates titles/resource schemes, and confirms removals. Metadata-only saves do not rewrite the curriculum. Creator retries reuse the created draft rather than creating another path.
- Sensitive direct Data API writes are revoked. Quota-checked creation remains available through its explicit RPC. Server membership mutations cannot demote/remove an admin or alter the caller's own membership.
- Notes are owner-only in API reads and database RLS. The board restores saved notes and shows their history.
- API handlers authenticate Bearer-only clients independently. Invalid explicit tokens fail closed.
- Visitor join attempts preserve the selected path through sign-in; successful requests show a pending/success state.
- Next.js 16.4.3 and compatible dependency patches remove the vulnerabilities reported by npm audit. CI now runs the embedded PostgreSQL safety tests in addition to lint/build.

Verification: 8 local automated tests pass; lint passes with two existing image warnings; the patched production build passes; npm audit reports zero vulnerabilities. The live local API acceptance check passed using two disposable users and one private path, including Bearer-only identity, approval, private notes, stable IDs/activity, stale-edit HTTP 409, admin guards, and invalid-input rollback. All fixtures were removed; the original six users, three paths, and four progress rows remain, with an unchanged progress checksum. Browser checks covered public discovery, visitor join-to-sign-in continuation, and sign-in at 390px and 1280px widths. Full authenticated browser interaction and actual OTP email delivery are still unverified.

The original findings below are retained as the assessment baseline, not as a claim that every item is still open. Remaining release work includes full signed-in browser acceptance at desktop/mobile widths, production OTP delivery and configuration review, operational backups/alerts/rate limiting, creator preview, and publication-transition policy. This is the first safety slice, not a declaration that the entire product is production-ready. Code changes still need deployment; the database migration alone does not retire an older destructive API handler.

#### Existing-account authentication review — 28 October 2026

- Verified all five existing synthetic QA users through the real local callback/session and Journey/API checks. Browser checks opened each signed-in Journey, the path-admin settings, and the super-admin platform directory. Fixed a signed-in mobile header overflow; the rendered page now fits a 390px viewport without horizontal overflow. The expanded offline suite passes 11 tests, and lint/build pass (two pre-existing image warnings). Learner, visitor, and moderator have no path memberships; path admin owns the empty Cloud Foundations path; super admin has platform authority. These fixture gaps remain visible and were not silently altered.
- Added origin-aware email redirects and the missing PKCE/token-hash callback. The actual localhost allowlist and email template must still be checked in the Supabase dashboard. A 429 email limit was observed; no-email QA links avoid sending emails while preserving real Auth validation.
- Retained and expanded reusable tests and opt-in integration scripts. Installed skills, connector configuration, local integration settings, credentials/session artifacts, and test outputs are ignored by Git; shared source/tests/migrations/CI remain versioned.

#### Release blockers found in source review

| Priority | Finding and source | Required outcome |
|---|---|---|
| P0 | `app/api/paths/[pathId]/plan/route.ts` deletes phases before inserting a replacement, outside a transaction. Foreign-key cascades in `docs/DB-schema.sql` delete associated progress and notes. `components/PathSettings.tsx` calls this even for metadata saves and discards existing lesson IDs. | Preserve IDs and learner activity for retained lessons; make curriculum writes atomic; separate metadata saves; validate the entire payload before writing; explicitly confirm destructive removals. Test rollback and concurrent edits. |
| P0 | The canonical schema grants authenticated direct path inserts and updates; its insert policy checks only creator identity, and its update policy does not protect publication fields. | Prevent direct database access from bypassing creator quota or setting platform publication approval. Verify both API calls and direct Supabase requests. |
| P0 | The membership insert policy permits a caller's pending row without restricting its role; the update policy gives moderators broad membership updates. Approval preserves the submitted role. | Enforce learner-only join requests and the permitted role transitions at the database boundary; prevent self-promotion and protect the creator/last admin. Test adversarial direct requests. |
| P0 | The notes read API and RLS permit other approved members to read notes labelled Personal Notes. `components/PathBoard.tsx` saves notes but does not fetch saved notes. | Make personal notes owner-only through both API and RLS, and restore them on return. If shared notes are later desired, define a separate explicit sharing experience. |
| P1 | `proxy.ts` checks cookie identity before protected API handlers can resolve Bearer tokens. | Verify protected APIs with Bearer-only sessions, cookies, expired tokens, and no session; preserve JSON authentication failures. |
| P1 | A successful join sets the board's fatal error state. Sign-in always returns to Journey, losing the selected path. | Show a durable pending/success state, preserve a safe internal return destination, and make approval/continuation understandable. |
| P1 | Curriculum validation checks only the top-level array. Path creation and first curriculum save are separate writes. | Validate field types, required titles, resource URL schemes, and payload limits; recover a created draft after a failed initial save without creating duplicates. |
| P1 | Existing admin-member actions can target admin rows; server checks do not preserve a last admin. | Enforce role-transition and removal rules server-side and in RLS, including self-removal safeguards. |

These are source/schema findings, not claims about the policies currently installed in the live Supabase project. Inspect deployed grants, policies, functions, and migration history before applying fixes.

#### Delivery order and acceptance gates

1. **Protect data and roles.** Resolve the P0 items with additive, reviewed migrations for existing databases. Add integration coverage for outsider, pending/rejected learner, approved learner, moderator, Path Admin, and Platform Admin across two paths. Include direct Supabase access, quota concurrency, publication self-approval, note privacy, and curriculum rollback/preservation.
2. **Complete the learner loop.** Fix join/sign-in continuity, notes restoration, visible write failures/retries, creator draft recovery, editor validation, preview, and destructive-change confirmation. Verify progress and notes survive refresh, sign-out/sign-in, and safe curriculum edits.
3. **Prepare operations.** Verify staging/production separation, all four documented environment variables (including the production base URL), deployed schema compatibility, OTP email template/code length and delivery using production SMTP, authentication limits, write abuse protection, error alerts, data backup/restore, and deployment rollback. Provide clear support, privacy, terms, and account/data-deletion guidance appropriate to the launch audience. Assign an operator for membership and publication queues.
4. **Run release acceptance.** Pass lint and production build; test the full visitor-to-returning-learner journey at desktop/mobile widths and with keyboard navigation. Exercise failed writes, empty plans, pending/rejected requests, session expiry, and private paths. Verify actual production configuration rather than inferring it from repository files.
5. **Publish the focused beta.** Launch with a few complete, reviewed curricula and a small facilitated group. Observe discovery-to-sign-in, join approval, first lesson completion, and returning learning using privacy-conscious measurement. Expand after the core loop works reliably for real users.

Do not set a guaranteed launch date until the deployed database and acceptance journeys have been checked. Scope launch by these gates rather than completion of every roadmap phase.

#### Documentation and operational drift

- `README.md`, `docs/engineering/development.md`, and `app/docs/[slug]/page.tsx` still reference a missing `phase1-schema.sql`; the checked-in canonical schema is `docs/DB-schema.sql`.
- The database seed examples use text IDs such as `test-path-public` where the canonical schema requires UUIDs; repair before using them for acceptance tests.
- `docs/operations/deployment.md` omits `NEXT_PUBLIC_BASE_URL` and describes `db pull` as a data backup. Replace that procedure with a verified data backup and restore process.
- `docs/operations/release-checklist.md` describes runtime/configuration settings absent from the current `vercel.json`. Avoid using its historical claims as deployment evidence.
- Public `/docs` pages contain manually maintained summaries rather than rendering the canonical Markdown; reconcile API/setup/status inaccuracies before release.

External operational references: [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [production SMTP](https://supabase.com/docs/guides/auth/auth-smtp), and [database backups](https://supabase.com/docs/guides/platform/backups).

Review verification: `npm run lint` passed with two existing `no-img-element` warnings in Header and AccountDashboard. `npm run build` remained at compilation without additional output and was interrupted; a successful production build remains unverified. No authenticated browser journeys or deployed database policies were tested in this review. Only this planning document was changed.

Implemented:

- Supabase email OTP authentication.
- Public discovery of approved public paths.
- User-created Learning Paths.
- Automatic creator-to-path-admin membership.
- Path metadata and nested plans.
- Path-scoped membership requests and approvals.
- Progress tracking and Community Progress/leaderboard data.
- Personal Notes.
- Profile management.
- Path-scoped APIs and Bearer-token compatibility.
- CI lint/build validation.
- `/explore` discovery experience.
- `/journey` authenticated Journey experience.
- Shared Learning Path card visual language across Explore and Journey.
- Learning Space-oriented path-board experience.

The database and authorization model remain the source of truth. Product UX changes must not weaken tenant isolation or role boundaries.

## Creator Model and Product Usage Limits

Creating a Learning Path is a normal registered-user capability, not a Platform Admin capability.

- Any registered user can create a Learning Path.
- The creator automatically becomes the Path Admin for that path through the database trigger.
- Path Admin authority is scoped to the created path.
- The same user can simultaneously be Admin on one path, Moderator on another, and Learner on another.
- Joining an existing Learning Path does not consume creator allowance.

### Default creator entitlement

The current default allowance is:

```text
maxCreatedPaths = 3
```

Each user may create/own up to 3 Learning Paths under the default entitlement, regardless of whether those paths are public or private. The limit must be enforced server-side; a UI-only counter is not sufficient.

UI may communicate usage in a human-readable form such as `2 of 3 Learning Paths used`. The implementation should use a configurable entitlement value such as `maxCreatedPaths` rather than scattering the literal `3`, because future subscription tiers may increase the allowance.

Subscription/payment infrastructure is explicitly out of scope for the current roadmap. The entitlement model should be designed so future plans can change the allowance without changing the tenant hierarchy or role semantics.

Creation UX should clearly communicate two product modes:

```text
Join a Learning Journey
        OR
Lead a Learning Journey
        -> Create a Learning Path
        -> Become its Path Admin
        -> Build the Learning Space for the group/community
```

Creator actions should be visible in normal product surfaces such as the homepage, Explore, and My Journey rather than hidden exclusively inside administration screens.

## Phase 1.5b: Identity and Authentication Journey — NEXT

Before adding major community or AI functionality, make identity and authentication consistent across the product.

### Authentication Journey

- `Start Learning` on the homepage must be session-aware: unauthenticated users go to `/auth`; authenticated users go to `/journey`.
- Successful OTP/magic-link authentication should land a normal user in `/journey` unless a deliberate return destination exists.
- Preserve safe deep-link/return-to behavior where appropriate.
- Keep `/paths` functional as a compatibility route.

### Profile Identity

Authentication identity and product profile identity must remain separate:

```text
Supabase Auth -> authenticated user/session/email
profiles      -> display name/avatar/bio/links/visibility/badges
```

- Header should use `profiles.display_name` as the product-facing name.
- Header should use `profiles.avatar_url` when available and fall back to initials when absent/invalid.
- Profile changes should become visible in the authenticated shell without requiring an unnecessary full logout/login cycle.
- Do not copy profile fields into auth metadata merely to solve UI freshness.
- Profile visibility defaults to joined-paths-only unless the user explicitly chooses public visibility.

### Role-Aware Navigation

The same person can have different roles on different Learning Paths:

```text
User A
  Path A -> admin
  Path B -> moderator
  Path C -> learner
```

The UI must therefore determine management actions from the relevant path membership and platform-admin status, not from a single global role label.

- Learner: personal Journey and learning actions.
- Moderator: path-scoped delegated moderation.
- Path Admin / Space Creator: management of their own path/space.
- Platform Admin / Super Admin: protected platform-wide operations.
- Never present Path Admin as equivalent to Platform Admin.

### Phase 1.5b Implementation Status

The identity and account slice is implemented:

- `/start-learning` routes unauthenticated visitors to `/auth` and authenticated users to `/journey`.
- OTP authentication lands normal users in `/journey`.
- Header identity uses the `profiles` display name and avatar with initials fallback.
- The account menu exposes Profile, My Journey, Manage Account, conditional Platform Admin, and Logout.
- `/account` shows identity, path-scoped roles and permissions, paths led, paths joined, creator capacity, and quota-request state.
- Path Admins can explicitly delete their own paths through the authorized DELETE endpoint.
- Creator capacity is derived from current owned paths and enforced transactionally through the database function.
- Platform Admins can review quota increase requests; approvals update the entitlement and preserve an audit trail.

Existing databases must apply the additive schema statements documented in `docs/operations/database.md`. The canonical creation schema is `docs/DB-schema.sql`.

## Phase 1.5c: Product Experience Consolidation — COMPLETE

Once identity is stable, finish the current product-experience foundation before moving into large new capabilities.

### Homepage and Explore

- Refine the discovery-first homepage.
- Keep `/explore` as the primary discovery route.
- Make **Create a Learning Path** a clear secondary product action alongside discovery.
- Explain that registered users can create a path and lead learning for their own group/community.
- Improve search, topic filtering, empty/loading/error states, and responsive behavior.
- Keep Learning Path cards visually consistent with My Journey.
- Avoid fake popularity/ranking metrics.

### My Journey

- Make `/journey` the canonical personal dashboard.
- Prioritize current goals, active Learning Spaces, progress, pending memberships, and next action.
- Distinguish spaces the user created/manages from spaces they joined.
- Provide a visible **Create a Learning Path** action.
- In an empty Journey, offer both **Explore Learning Paths** and **Create a Learning Path**.
- Show role-appropriate actions for learner, moderator, and Path Admin contexts.
- Consider a deliberate `/api/journey` aggregate endpoint if client-side data loading becomes unnecessarily chatty; do not introduce this merely for cosmetic reasons.

### Phase 1.5c Implementation Status

Complete for the current product-experience scope. The homepage and Explore provide discovery, search, topic filtering, loading/empty/error states, and clear creation entry points. My Journey is the canonical personal dashboard with active spaces, progress, pending memberships, role-aware actions, and both Explore and Create actions in the empty state. Learning Path cards share a reusable visual language, and the existing Learning Space exposes only implemented areas. Remaining accessibility and responsive validation work belongs to the production-readiness review rather than blocking this product-experience milestone.

### Learning Space

Refine the existing path board as the collaborative Learning Space:

- Overview.
- Learning Path.
- Members.
- Progress.
- Discussions only when implemented.
- Resources only when implemented.

Do not expose inactive tabs as if functionality exists.

### Responsive and Accessibility Consolidation

- Reusable navigation/header.
- Shared Learning Path cards.
- Progress/status components.
- Loading/empty/error/success states.
- Keyboard navigation and visible focus.
- Screen-reader labels and semantic controls.
- Desktop/mobile validation across primary journeys.

## Phase 2: Creator and Community — IN PROGRESS

### Creator Entitlement Enforcement

Before expanding creator functionality, enforce the current allowance at the trusted server/database boundary.

- Check current created/owned path usage before creation.
- Reject creation when usage reaches `maxCreatedPaths`.
- Make the check safe against concurrent create requests.
- Keep entitlement separate from path role authorization.
- Keep the default entitlement configurable for future subscription tiers.
- Do not add payment/subscription infrastructure as part of this work.

### Guided Plan Editor

Replace JSON-oriented plan editing with a guided interface:

- Add/remove/reorder phases.
- Add/remove/reorder days.
- Add/remove/reorder lesson items.
- Validate required fields.
- Preview learner experience.
- Warn before replacing existing plans.
- Clear save/success/error states.

Current implementation provides the editable phase/day/item structure, reordering, membership management, and save feedback. Before Phase 2 can be marked complete, it still needs:

- Explicit server-side validation for required curriculum fields.
- Learner-facing curriculum preview.
- Confirmation before replacing an existing plan.

### Membership and Moderation Management

Implement the role hierarchy deliberately:

- Path Admin manages their Learning Space within path scope.
- Path Admin can promote/demote Moderators where authorized.
- Moderators receive only explicitly delegated permissions.
- Members can be removed according to policy.
- Show member display names instead of UUIDs where privacy permits.
- Show pending, approved, and rejected states clearly.

### Platform Publication Administration

Keep path visibility and platform publication status separate:

```text
Path Admin chooses public/private
            |
       if public
            v
Platform Admin review
      /           \
approved          rejected
   |
   v
Public Learning Wall
```

Implement:

- Review newly created public-path requests.
- Approve, reject, or unlist paths.
- Ensure public discovery requires `visibility = public` and `wall_status = approved`.
- Prevent Path Admins from self-approving platform publication.
- Keep platform-admin operations separate from path-admin operations.
- Add audit history where product policy requires it.

The publication workflow is implemented. Broader Phase 2 completion remains blocked by the guided-editor items above and the community-layer decisions below. Discussions, resources, Q&A, cohorts, challenges, and announcements remain intentionally deferred until their product scope is defined; they are not being counted as implemented.

### Community Layer

Evaluate and incrementally implement:

- Discussions.
- Learning resources.
- Questions and answers.
- Study groups/cohorts.
- Challenges/practice activities.
- Useful announcements.

The product should be social around learning, not a generic social-media clone.

## Phase 3: AI Companion

AI is a supporting learning capability, not the center of the product.

Candidate capabilities:

- Explain a topic.
- Quiz me.
- Create a learning plan.
- Identify knowledge gaps.
- Suggest what to learn next.
- Summarize or transform learner-provided notes where appropriate.

AI rules:

- Never display an AI capability as available until its backend exists.
- Ground suggestions in the learner's selected goal/path/context.
- Let learners accept, reject, edit, or ignore suggestions.
- Never silently modify learning plans or learner records.
- Preserve privacy and tenant isolation.

## Phase 4: Engagement and Recognition

Badges are a first-class recognition capability intended to reinforce learning rather than create points-first gamification.

### Automatic badges

Awarded for defined learning/progress milestones.

### Manual recognition

Authorized Path Admins and Moderators may award recognition within their permitted path scope.

### Badge audit trail

Badge awards should preserve, where supported by the schema:

- Recipient.
- Badge.
- Automatic/manual source.
- Awarding actor for manual awards.
- Path context where applicable.
- Timestamp.
- Reason or milestone context.

Also evaluate milestones, streaks, certificates, cohort announcements, and completion analytics.

## Phase 5: Production Readiness

This phase is not complete and must remain open before claiming that all pre-Phase-3 work is finished.

- Automated tests for API authorization and tenant isolation.
- Integration tests against a disposable Supabase project.
- Structured server logging without credentials or unnecessary personal data.
- Error monitoring and alerting.
- Rate limiting for authentication, join requests, feedback, and writes.
- Pagination for wall, members, notes, and Community Progress data.
- Database indexes reviewed against real query patterns.
- Staging and production Supabase projects.
- Backup and recovery procedure.
- CI lint/build checks.
- Secure deployment configuration.
- Accessibility and responsive regression review.

## Phase 6: Mobile Client

Build React Native clients for Android and iOS using the existing server APIs:

- Supabase mobile authentication and secure session storage.
- Shared path, membership, plan, progress, notes, and leaderboard contracts.
- Native navigation.
- Offline-friendly read caching.
- Retry handling for progress updates.
- Push-notification foundation if notifications become part of the product.

The mobile client must not access the database directly.

## UX Validation Backlog

Validate the actual journeys with seeded accounts and realistic data:

1. Visitor discovers an approved public Learning Path without signing in.
2. Visitor understands the value of joining a Learning Space.
3. Visitor clicks Start Learning and is routed appropriately based on authentication state.
4. Authenticated user lands in My Journey after sign-in.
5. Profile display name and avatar appear consistently across Header, Profile, Journey, and future community surfaces.
6. A user with different roles on different paths sees only the relevant management actions.
7. Learner identifies their current goal and next action immediately.
8. Creator can manage their Learning Space without platform-admin controls.
9. Creator sees accurate path usage and cannot exceed the server-enforced creator entitlement.
10. Moderator can perform only delegated path-scoped actions.
11. Platform Admin can deliberately perform platform publication operations.
12. Public path appears on the Learning Wall only after platform approval.
13. Private path content remains inaccessible to unauthorized users.
14. Badge visibility respects profile privacy and path scope.
15. Every major route has understandable loading, empty, success, and error states.
16. Desktop and mobile layouts remain coherent.

## Product Decisions Still Needed

1. Exact Moderator permission set beyond membership-request review.
2. Whether Path Admins can directly add users or must invite/request them through a defined workflow.
3. Which Platform Admin actions require mandatory audit history.
4. Exact public/private path transition rules after initial publication approval.
5. Whether Community Progress shows names, avatars, or anonymous rankings.
6. Exact profile visibility rules for badges and social/repository links.
7. Whether badge awards can be revoked and who may revoke them.
8. First community model: open discussion, cohorts, or focused study groups.
9. Exact future subscription tiers and the creator allowance attached to each tier.
10. Whether unused creator capacity can ever be restored after path deletion/archival.
11. First React Native workflow.
12. Public repository license and contribution policy.

## Guardrails for Future Work

- Update existing canonical documents rather than creating duplicates.
- Do not change database schema, RLS, authentication, API contracts, or tenant boundaries during UI-only work unless explicitly requested.
- Reuse existing APIs and components wherever practical.
- Do not invent product metrics or claim functionality that is not implemented.
- Do not create a second tenant hierarchy for Learning Spaces.
- Keep Platform Admin, Path Admin, Moderator, and Learner permissions distinct.
- Keep path roles scoped by `path_id`.
- Keep platform publication approval separate from path visibility.
- Treat profile identity separately from authentication identity.
- Keep badges auditable and privacy-aware.
- Treat creator allowance as a configurable entitlement enforced at the trusted server/database boundary.

## AI 101 curated content preparation

A seven-day beginner curriculum is prepared in Git, with original teaching content, 20 attributed external references, no-code practice, seven existing completion items and a repeatable development SQL generator. It reuses path enrollment, progress and Community Progress without new tables or scoring. Offline import/data-preservation tests cover its database contracts. Loading the course and completing the real learner browser journey are explicitly deferred until an isolated development project is configured; no production content was changed or deployed by this work.

AI 101 database alignment: the owner approved two optional Markdown fields for course overview and per-day teaching/resources/practice. Migration, API, settings and Learning Space support are prepared offline; production application and data remain unchanged. The Git JSON is the import authoring source, while the learner experience reads the existing path/day database records.

30 October 2026: the owner authorized AI 101 production installation in the absence of a separate database. A guarded, atomic production SQL generator is prepared and tested; remote execution is not complete because Supabase MCP OAuth refresh failed. Deployment and signed-in browser acceptance still remain.
