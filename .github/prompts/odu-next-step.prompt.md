# ODU Learner Companion — Step-by-Step Implementation Prompt

Use this prompt for incremental implementation in the local editor with GitHub Copilot or another coding agent.

## Mission

Continue building ODU Learner Companion as a professional collaborative learning companion for students, working professionals, and lifelong learners.

Primary product message:

> **Learn anything. Together.**

Core proposition:

> **You do not have to learn alone.**

The product should evolve from the current learning-tracker foundation into a calm, modern, discovery-first learning experience where people can discover learning goals, join or create Learning Spaces, follow structured Learning Paths, collaborate, practice, track progress, and eventually use AI assistance.

## First instruction: inspect before editing

Before making any change:

1. Read `README.md`.
2. Read `AGENTS.md`.
3. Read `.continue/rules/CONTINUE.md` if using Continue.
4. Read the relevant sections of:
   - `docs/business-guide.md`
   - `docs/architecture.md`
   - `docs/roadmap.md`
5. Inspect the existing route/component/API implementation that will be affected.
6. Do not assume that a feature exists because it is mentioned in the roadmap.

## Current implementation priority

Work through the product roadmap in small, reviewable slices. The immediate priority is **Phase 1.5 — Product Experience**:

1. Homepage modernization.
2. `/explore` discovery experience.
3. `/journey` learner dashboard.
4. Learning Space UX refinement around the existing path board.
5. Reusable responsive and accessible UI system.

Do not jump to community, AI, gamification, mobile, or production-hardening work unless explicitly requested.

## Critical architecture guardrails

**Do not change these during a UI/product-experience task unless explicitly requested:**

- Supabase database schema.
- PostgreSQL RLS policies.
- Authentication flow.
- Authorization model.
- Existing API contracts.
- `path_id` tenant boundaries.
- Existing membership/role semantics.

`learning_paths` remains the tenant root.

**Learning Space is a product/UX concept, not a new database tenant.** Do not create a `learning_spaces` table or second tenant hierarchy merely to support the terminology.

Reuse existing APIs and data wherever possible.

Never rely on client-side UI visibility as an authorization mechanism.

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
| Path admin | Space Creator / Facilitator |
| Platform admin | Platform Admin |

Database names and API paths do not need to change just because product language changes.

## Product experience

### Homepage

The homepage should be discovery-first and should clearly communicate the product in seconds.

Preferred hierarchy:

1. Header/navigation.
2. Hero: “Learn anything. Together.”
3. Supporting explanation for students, professionals, and lifelong learners.
4. Search prompt such as “What do you want to learn?”
5. Topic/category exploration.
6. Featured/relevant public Learning Paths.
7. Explanation of why learning together helps.
8. Preview of the learner Journey.
9. AI Companion preview only if clearly labelled as planned/coming soon unless actually implemented.
10. Strong final CTA.

Do not turn the homepage into a generic dashboard or social-media feed.

### Explore

Create `/explore` as the primary discovery experience when implementing that slice.

It should support the capabilities actually available in the backend, such as:

- Search.
- Topic/tag filtering.
- Public Learning Path discovery.
- Useful path summaries.
- Clear empty/no-result states.

Do not invent ranking, recommendation, popularity, or engagement metrics unless real data exists.

### My Journey

Create `/journey` as the preferred personal learning dashboard when implementing that slice.

It should answer:

- What am I learning?
- What is active right now?
- What did I complete?
- What should I do next?
- What notes have I captured?
- Where am I learning with other people?

Keep `/paths` working as a compatibility surface while transitioning the product language.

### Learning Space

Refine the existing path board into a Learning Space without changing its tenant model.

Potential sections include:

- Overview.
- Learning Path.
- Members.
- Progress.
- Discussions only when implemented.
- Resources only when implemented.

Do not show inactive tabs merely to suggest future features.

## Visual design direction

The interface should feel:

- Calm.
- Modern.
- Structured.
- Motivating.
- Trustworthy.
- Professional enough for students and working professionals.

Prefer:

- Strong information hierarchy.
- Restrained ink/cobalt-style primary treatment.
- Restrained positive-progress treatment.
- Consistent solid primary actions.
- Quiet bordered secondary actions.
- Readable interface typography with a coherent heading treatment.
- Generous but efficient spacing.
- Responsive layouts.
- Accessible focus, contrast, labels, and semantics.

Avoid:

- Neon visual treatment.
- Excessive glow.
- Heavy gradients.
- Glassmorphism as the default surface language.
- Stock-photo-heavy layouts.
- Decorative metrics with no product value.
- Excessive gamification.
- Social-media-style engagement mechanics.

The existing theme implementation may be reused or simplified, but do not create unnecessary styling infrastructure.

## Component strategy

Prefer reusable components over large page-specific JSX blocks.

As the UI grows, domain-oriented organization may use:

```text
components/
  odu/
  discovery/
  journey/
```

Only introduce these directories when they make reuse clearer; do not reorganize the entire repository just for aesthetics.

Potential reusable primitives include:

- Header/navigation.
- Hero.
- Search field.
- Topic chips.
- Learning Path card.
- Progress indicator.
- Status badge.
- Empty state.
- Loading state.
- Error state.
- Primary/secondary button treatments.
- Learning Space section.
- Journey card.

## Implementation protocol

For the requested task, follow this exact process.

### Step 1 — State the scope

Briefly state:

- What user problem this change solves.
- Which route(s) are affected.
- Which existing components/APIs will be reused.
- Whether a backend/API change is genuinely required.

If the task is UI-only, explicitly say that database, auth, RLS, and API contracts will remain unchanged.

### Step 2 — Inspect current code

Read the actual files before editing. Do not rewrite based on assumptions.

Look for:

- Existing components that can be reused.
- Existing CSS variables/theme rules.
- Existing API calls.
- Existing loading/error states.
- Existing authorization checks.
- Existing route conventions.

### Step 3 — Implement the smallest coherent slice

Make only the changes required for the requested slice.

Do not:

- Refactor unrelated files.
- Change database schema.
- Replace the authentication system.
- Rename APIs unnecessarily.
- Add placeholder functionality that looks real.
- Introduce a new framework without explicit approval.

### Step 4 — UX quality check

For UI changes, verify:

- Desktop layout.
- Mobile layout.
- Loading state.
- Empty state.
- Error state.
- Success state where applicable.
- Keyboard navigation.
- Visible focus states.
- Semantic labels.
- Contrast.
- Clear next action.

### Step 5 — Functional verification

Run:

```bash
npm run lint
npm run build
```

If a command fails, fix the issue before claiming completion unless the failure is clearly unrelated and explicitly reported.

### Step 6 — Manual validation

Run the app locally and inspect the affected route at desktop and mobile widths.

For user journeys, validate the actual flow rather than only checking that the page renders.

### Step 7 — Report

At the end, report:

- Files changed.
- What was implemented.
- Existing APIs reused.
- Any architectural decisions made.
- Verification results.
- Remaining follow-up work.

If a durable product or architecture decision was made, update the appropriate existing document in `docs/` rather than creating a new document.

## AI Companion boundary

AI is a planned supporting capability.

Possible future actions:

- Explain a topic.
- Quiz me.
- Create a learning plan.
- Identify knowledge gaps.
- Suggest what to learn next.
- Summarize learner-provided notes where appropriate.

Until the backend exists, label these as planned/coming soon. Never make a static mock look like a working AI feature.

When AI is eventually implemented:

- Ground suggestions in the learner's selected goal/path/context.
- Let the learner accept, reject, edit, or ignore suggestions.
- Never silently modify learning plans or learner records.
- Preserve tenant isolation and privacy.

## Route compatibility

Current routes remain valuable during the transition:

- `/` — current homepage/wall surface; evolve it into the discovery-first homepage.
- `/paths` — existing learner paths; keep functional while `/journey` becomes preferred.
- `/paths/[pathId]` — existing path board; evolve into Learning Space UX.
- `/paths/[pathId]/settings` — creator/path settings.
- `/paths/[pathId]/approvals` — membership approvals.
- `/admin` — platform administration.

Preferred future routes:

- `/explore`.
- `/journey`.

Do not break existing working routes merely to introduce new terminology.

## Documentation rule

There is one canonical documentation set under `docs/`.

Update existing files:

- `docs/business-guide.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/api.md`
- `docs/development.md`
- `docs/database-operations.md`
- `docs/README.md`

Do not create files such as:

- `architecture-v2.md`
- `new-roadmap.md`
- `business-guide-new.md`
- `design-v2.md`

unless explicitly requested.

## Final guardrails

Before making changes, ask yourself:

1. Is this aligned with “Learn anything. Together.”?
2. Does it improve discovery, learning, collaboration, progress, or the learner's next useful action?
3. Am I changing a backend/security boundary unnecessarily?
4. Am I presenting a planned feature as implemented?
5. Can I reuse an existing component/API instead of adding another abstraction?
6. Is this the smallest coherent change that moves the product forward?

If the answer to the third or fourth question is yes, stop and reconsider the implementation.
