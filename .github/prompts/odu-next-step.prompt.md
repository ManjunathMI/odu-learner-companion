# ODU Learner Companion — Step-by-Step Implementation Prompt

Use this prompt for incremental implementation in the local editor with GitHub Copilot or another coding agent.

## Mission

Continue building ODU Learner Companion as a professional collaborative learning companion for students, working professionals, and lifelong learners.

Primary message: **Learn anything. Together.**

Core proposition: **You do not have to learn alone.**

The product journey is:

```text
Discover -> Choose a learning goal -> Join/create a Learning Space
-> Learn -> Collaborate -> Practice -> Track progress -> Reflect -> Grow
```

## First instruction: inspect before editing

Before making any change:

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Read `.continue/rules/CONTINUE.md` if using Continue.
4. Read the relevant sections of:
   - `docs/business-guide.md`
   - `docs/architecture.md`
   - `docs/roadmap.md`
5. Inspect the actual route/component/API/database-type implementation affected by the task.
6. Do not assume a feature exists because it appears in documentation.

## Canonical role and authority model

ODU has two authority levels:

### Platform level

**Platform Admin / Super Admin** is stored in `platform_admins` and handles explicit platform-wide operations such as public Learning Path publication review, platform moderation, and other protected administration.

### Path level

`admin`, `moderator`, and `learner` are roles stored in `path_memberships` and are scoped by `path_id`.

A user may simultaneously be:

```text
Path A -> admin
Path B -> moderator
Path C -> learner
```

Never treat a user as having one global path role.

Rules:

- Any registered user can create a Learning Path.
- The creator automatically becomes the approved Path Admin for that path through the existing database trigger.
- Path Admin manages their own Learning Path / Learning Space within that path's permissions.
- Moderator is a delegated path-scoped role and does not automatically inherit all Path Admin permissions.
- Platform Admin is separate from Path Admin and cannot be inferred from path membership.
- Never label a Path Admin as a Super Admin.
- Never rely on client-side role visibility as authorization.

## Path visibility and publication model

Path visibility and platform publication are separate.

```text
Path Admin chooses visibility
        |
        +-- private --> approved members / authorized operators
        |
        +-- public --> Platform Admin review
                              |
                       approved / rejected
                              |
                         approved public
                              |
                       Public Learning Wall
```

The intended public discovery condition is:

```text
visibility = public
AND
wall_status = approved
```

A Path Admin cannot self-approve public publication.

Do not change this model or create a second publication hierarchy without explicit instruction.

## Profile and authentication identity model

Authentication identity and product profile identity are separate.

```text
Supabase Auth
  -> user id / session / email

profiles
  -> display_name
  -> avatar_url
  -> bio
  -> social/repository links
  -> visibility
  -> badges / achievement presentation
```

Rules:

- Supabase Auth answers who is authenticated.
- `profiles` answers how the user is represented in ODU.
- Product UI should prefer `profiles.display_name` over auth `user_metadata`.
- Product UI should use `profiles.avatar_url` with a safe initials fallback.
- Do not copy editable profile fields into auth metadata just to solve UI rendering.
- Default profile visibility is joined-paths-only unless the user explicitly chooses a public profile.
- Badge visibility must respect profile privacy and path scope.

## Current product priority

The immediate priority is **Identity and Authentication Journey**, followed by consolidation of the Phase 1.5 product experience.

1. Session-aware Start Learning flow.
2. Authentication success -> `/journey`.
3. Header profile name/avatar consistency.
4. Role-aware navigation and management actions.
5. Explore/My Journey/Learning Space refinement.
6. Creator and Community.
7. AI Companion.
8. Engagement and recognition.
9. Production readiness.
10. Mobile.

Do not jump to later phases unless explicitly requested.

## Authentication task baseline

When implementing authentication-related work:

- An unauthenticated visitor clicking Start Learning should reach `/auth`.
- An authenticated user clicking Start Learning should reach `/journey`.
- Prefer a small server-side redirect route such as `/start-learning` when session state determines the destination.
- Successful OTP/magic-link authentication should normally redirect to `/journey`, unless a safe, deliberate return destination exists.
- `/paths` remains functional as a compatibility route.
- Preserve existing Supabase Auth, SSR session, and API authentication behavior.

## Product vocabulary

Use these consistently in user-facing UI:

| Existing concept | Preferred product language |
|---|---|
| Public wall | Explore / Learning Wall |
| Learning path | Learning Path |
| Path membership | Join a Learning Space |
| My Paths | My Journey |
| Path board | Learning Space |
| Notes | Personal Notes |
| Leaderboard | Community Progress |
| Path admin | Space Creator / Facilitator / Path Admin |
| Platform admin | Platform Admin / Super Admin |

Database names and API paths do not need to change just because product language changes.

## Product experience

### Homepage

The homepage should be discovery-first and communicate the product quickly:

1. Hero: “Learn anything. Together.”
2. Supporting explanation.
3. Search prompt such as “What do you want to learn?”
4. Topic/category exploration.
5. Featured/relevant public Learning Paths.
6. Why learning together helps.
7. Journey preview.
8. AI Companion preview only when clearly marked planned/coming soon unless implemented.
9. Session-aware Start Learning CTA.

### Explore

`/explore` is the primary public discovery experience.

Use real backend capabilities only:

- Search.
- Topic/tag filtering.
- Approved public Learning Path discovery.
- Useful path summaries.
- Clear loading/empty/error states.

Do not invent popularity, ranking, recommendation, or engagement metrics.

### My Journey

`/journey` is the preferred authenticated personal learning dashboard.

It should answer:

- What am I learning?
- What is active right now?
- What did I complete?
- What should I do next?
- What Personal Notes have I captured?
- Where am I learning with other people?

Role-aware actions must be based on the relevant path membership and platform-admin status.

### Learning Space

Present the existing path board as the collaborative Learning Space without changing the tenant model.

Potential sections:

- Overview.
- Learning Path.
- Members.
- Progress.
- Discussions only when implemented.
- Resources only when implemented.

Do not show inactive tabs as if functionality exists.

## Visual design direction

The interface should feel calm, modern, structured, motivating, trustworthy, and professional.

Prefer:

- Strong information hierarchy.
- Consistent Learning Path cards across Explore and Journey.
- Restrained primary/positive-progress treatments.
- Consistent solid primary actions.
- Quiet bordered secondary actions.
- Readable typography.
- Responsive layouts.
- Accessible focus, contrast, labels, and semantics.

Avoid:

- Neon visual treatment as the normal product language.
- Excessive glow.
- Heavy gradients.
- Glassmorphism as default surfaces.
- Stock-photo-heavy layouts.
- Decorative metrics without product value.
- Excessive gamification.
- Social-media-style mechanics.

## Component strategy

Prefer reusable components over large page-specific JSX blocks.

Use domain-oriented organization where it improves reuse:

```text
components/
  odu/
  discovery/
  journey/
```

Reuse established components before creating new ones. Do not reorganize the entire repository for aesthetics alone.

## Critical architecture guardrails

**Do not change these during ordinary UI/product work unless explicitly requested:**

- Supabase database schema.
- PostgreSQL RLS policies.
- Authentication architecture.
- Authorization semantics.
- Existing API contracts.
- `path_id` tenant boundaries.
- `path_memberships` role/status semantics.
- Public visibility/publication semantics.

`learning_paths` remains the tenant root.

**Learning Space is a product/UX concept, not a new database tenant.** Do not create a `learning_spaces` table or second tenant hierarchy merely to support terminology.

Reuse existing APIs and data wherever possible.

## Implementation protocol

For every requested task:

### Step 1 — State the scope

Briefly state:

- User problem being solved.
- Routes affected.
- Components/APIs being reused.
- Whether backend/API work is genuinely required.

If UI-only, explicitly state that database, RLS, auth, authorization, and API contracts remain unchanged.

### Step 2 — Inspect current code

Read the actual files before editing. Check existing:

- Components.
- CSS variables/theme rules.
- API calls.
- Session/auth helpers.
- Authorization checks.
- Loading/error states.
- Responsive/accessibility patterns.

### Step 3 — Implement the smallest coherent slice

Make only the requested change.

Do not:

- Refactor unrelated files.
- Replace Supabase Auth.
- Change schema/RLS unnecessarily.
- Rename APIs unnecessarily.
- Add fake functionality.
- Add a new framework without explicit approval.

### Step 4 — Security and role check

For any role/auth/path-related change verify:

- Is the role derived from the correct `path_id` membership?
- Is Platform Admin kept separate?
- Can a Path Admin accidentally gain platform authority?
- Can a Moderator accidentally gain all admin permissions?
- Is private path information protected?
- Is client-side visibility being incorrectly treated as authorization?
- Does public discovery still require platform approval?

### Step 5 — UX quality check

For UI changes verify:

- Desktop.
- Mobile.
- Loading.
- Empty.
- Error.
- Success where applicable.
- Keyboard navigation.
- Visible focus.
- Semantic labels.
- Contrast.
- Clear next action.

### Step 6 — Functional verification

Run:

```bash
npm run lint
npm run build
```

If a command fails, fix the issue before claiming completion unless the failure is clearly unrelated and explicitly reported.

### Step 7 — Manual journey validation

For authentication/profile/role work, validate real journeys rather than only rendering pages.

At minimum consider:

```text
Visitor -> Start Learning -> Auth
Authenticated -> Start Learning -> Journey
Authenticated -> Profile update -> Header reflects profile
Learner -> path -> learner actions only
Moderator -> path -> moderator actions only
Path Admin -> own path -> admin actions
Platform Admin -> admin -> platform operations
```

### Step 8 — Report

Report:

- Files changed.
- What was implemented.
- Existing APIs/helpers reused.
- Role/security implications.
- Verification results.
- Remaining follow-up work.

If a durable product or architecture decision changes, update the appropriate existing document in `docs/` rather than creating a new one.

## AI Companion boundary

AI is a planned supporting capability.

Candidate actions:

- Explain a topic.
- Quiz me.
- Create a learning plan.
- Identify knowledge gaps.
- Suggest what to learn next.
- Summarize learner-provided notes where appropriate.

Until the backend exists, label these as planned/coming soon. Never make a static mock look like a working AI feature.

When implemented:

- Ground suggestions in learner goal/path/context.
- Let learners accept, reject, edit, or ignore suggestions.
- Never silently modify learning plans or learner records.
- Preserve tenant isolation and privacy.

## Badges and recognition boundary

Badges are planned/expanding recognition functionality, not points-first gamification.

They may be:

- Automatically awarded for defined learning milestones.
- Manually awarded by authorized Path Admins/Moderators within permitted path scope.

Badge awards should eventually retain an audit trail. Badge presentation must respect profile visibility and path scope.

Do not present future badge functionality as implemented.

## Route compatibility

Current routes remain valuable:

- `/` — homepage/discovery.
- `/auth` — authentication.
- `/paths` — compatibility dashboard.
- `/paths/[pathId]` — Learning Space/path board.
- `/paths/[pathId]/settings` — creator/path settings.
- `/paths/[pathId]/approvals` — membership approvals.
- `/admin` — platform administration.
- `/explore` — preferred discovery route.
- `/journey` — preferred personal learning route.

Do not break working compatibility routes merely to introduce product terminology.

## Documentation rule

There is one canonical documentation set under `docs/`.

Update existing files when decisions change:

- `docs/business-guide.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/api.md`
- `docs/development.md`
- `docs/database-operations.md`
- `docs/README.md`

Do not create duplicate files such as:

- `architecture-v2.md`
- `new-roadmap.md`
- `business-guide-new.md`
- `design-v2.md`

unless explicitly requested.

## Final guardrails

Before making changes, ask:

1. Is this aligned with “Learn anything. Together.”?
2. Does it improve discovery, learning, collaboration, progress, identity, or the learner's next useful action?
3. Am I preserving the distinction between Platform Admin, Path Admin, Moderator, and Learner?
4. Am I preserving path-scoped roles?
5. Am I preserving the distinction between path visibility and platform publication approval?
6. Am I keeping profile identity separate from authentication identity?
7. Am I changing a backend/security boundary unnecessarily?
8. Am I presenting a planned feature as implemented?
9. Can I reuse an existing component/API/helper?
10. Is this the smallest coherent change that moves the product forward?

If the answer to questions 7 or 8 is yes, stop and reconsider the implementation.
