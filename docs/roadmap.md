# Product Roadmap

This roadmap is the canonical planning document for ODU Learner Companion. It builds on the existing multi-tenant foundation and evolves the product from a learning tracker into a collaborative learning companion for students, working professionals, and lifelong learners.

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

## Current State: Foundation

Implemented and available for local testing:

- Supabase email OTP authentication.
- Public wall for approved public paths.
- User-created learning paths.
- Database-triggered creator-to-path-admin membership.
- Path metadata editing.
- Nested plans: phases, days, and lesson items.
- Path-scoped learner membership requests.
- Moderator/admin approval queue.
- Path-scoped progress tracking.
- Path leaderboard.
- Path-scoped notes.
- Profile management.
- Public documentation and API contracts.
- Bearer-token-compatible API design for a future React Native client.
- CI checks for repository lint and production-build validation.

The canonical database schema remains the source of truth for tenant isolation and role behavior. Product-layer redesign must not weaken these boundaries.

## Phase 1.5: Product Experience

This is the immediate priority: make the existing foundation feel like a professional learning companion before adding large amounts of functionality.

### Brand and Product Language

- Establish ODU as a learning companion rather than only a tracker.
- Use `Learn anything. Together.` as the primary positioning direction.
- Keep the multilingual `ಓದು` identity as a brand element rather than relying on it to explain the product.
- Use consistent terminology across navigation, cards, empty states, CTAs, and documentation.

Preferred product vocabulary:

| Current concept | Product-facing language |
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

### Homepage and Discovery

Move the public homepage from a tracker-first presentation toward discovery:

1. Hero explaining the product in one clear sentence.
2. Search prompt such as “What do you want to learn?”
3. Topic/category exploration.
4. Featured or relevant public learning paths.
5. Explanation of why learning together is useful.
6. Preview of the learner journey.
7. AI Companion preview marked as planned or available only where actually implemented.
8. Clear sign-in/start-learning CTA.

Introduce `/explore` as the clearer discovery route while retaining existing routes where compatibility is useful.

### My Journey

Introduce `/journey` as the preferred personal learning dashboard, with `/paths` retained as a compatibility route while the experience transitions.

The journey should answer:

- What am I learning?
- What is active right now?
- What did I complete?
- What should I do next?
- What notes or reflections have I captured?
- Where am I learning with other people?

### Learning Space UX

Present the existing path board as a collaborative Learning Space without changing the tenant model.

Potential structure:

- Overview
- Learning Path
- Members
- Progress
- Discussions — only when implemented
- Resources — only when implemented

Do not show empty tabs merely to imply future functionality.

### Responsive Design System

Establish reusable UI primitives and domain components for:

- Navigation/header.
- Hero and discovery sections.
- Search/filter controls.
- Learning-path cards.
- Progress indicators.
- Status badges.
- Empty/loading/error states.
- Primary and secondary buttons.
- Learning Space sections.
- Journey cards.

Visual direction:

- Calm, modern, structured, motivating, and trustworthy.
- Restrained ink/cobalt-style primary system with restrained positive-progress treatment.
- Readable interface typography with a coherent heading/display treatment.
- Avoid excessive gradients, glassmorphism, neon effects, stock imagery, and decorative dashboards.
- Prioritize hierarchy and the learner's next useful action over visual novelty.

## Phase 2: Creator and Community

### Guided Plan Editor

Replace the JSON-oriented plan editing experience with a guided interface:

- Add, remove, and reorder phases.
- Add, remove, and reorder days.
- Add, remove, and reorder lesson items.
- Validate required fields before saving.
- Preview the learner experience.
- Warn before replacing an existing plan.
- Provide clear save, success, and error states.

### Membership Management

Add creator/facilitator controls for:

- Promoting an approved learner to moderator.
- Demoting a moderator.
- Removing a member.
- Viewing member display names instead of UUIDs.
- Showing pending, approved, and rejected states clearly.

### Community Layer

Evaluate and incrementally implement:

- Discussions.
- Learning resources.
- Questions and answers.
- Study groups or cohorts.
- Challenges or practice activities.
- Useful announcements.

The product should be social around learning, not a generic social-media clone.

### Platform Admin Console

Add server-backed platform administration:

- Review paths requesting public listing.
- Approve, reject, or unlist paths.
- View platform-level feedback.
- Manage platform admins through protected operations.
- Keep platform-admin access separate from path-admin access.
- Establish audit history where product policy requires it.

## Phase 3: AI Companion

Introduce AI as a supporting learning capability rather than as the center of the product.

Candidate capabilities:

- Explain a topic.
- Quiz me.
- Create a learning plan.
- Identify knowledge gaps.
- Suggest what to learn next.
- Summarize or transform learner-provided notes where appropriate.

Implementation principles:

- Never display an AI feature as available until its backend capability exists.
- Keep AI suggestions grounded in the learner's selected goal/path/context.
- Let learners accept, reject, edit, or ignore AI-generated suggestions.
- Avoid allowing AI to silently modify learning plans or learner records.
- Treat privacy and tenant isolation as first-class requirements.

## Phase 4: Engagement and Recognition

The schema already reserves space for badges. Evaluate:

- Automatic completion badges.
- Manual moderator/admin awards.
- Path-specific and platform-wide badges.
- Learner achievement history.
- Milestones.
- Streaks.
- Certificates.
- Cohort announcements.
- Completion analytics.

Engagement should reinforce learning behavior rather than turn the product into a points-first gamification system.

## Phase 5: Production Readiness

Harden the platform before broad public adoption:

- Automated tests for API authorization and tenant isolation.
- Integration tests against a disposable Supabase project.
- Structured server logging without credentials or unnecessary personal data.
- Error monitoring and alerting.
- Rate limiting for authentication, join requests, feedback, and write endpoints.
- Pagination for wall, members, notes, and leaderboard data.
- Database indexes reviewed against real query patterns.
- Staging and production Supabase projects.
- Backup and recovery procedure.
- CI build and lint checks.
- Secure deployment environment configuration.
- Accessibility review covering keyboard navigation, focus states, contrast, labels, and screen-reader semantics.
- Desktop and mobile validation across the main product journeys.

## Phase 6: Mobile Client

Build React Native clients for Android and iOS using the existing server APIs:

- Supabase mobile authentication and secure session storage.
- Shared path, membership, plan, progress, notes, and leaderboard contracts.
- Native navigation.
- Offline-friendly read caching.
- Retry handling for progress updates.
- Push-notification foundation if notifications become part of the product.

The mobile client must not access the database directly. It should use the same server API and authorization rules as the web client.

## UX Validation Backlog

Before moving aggressively into new features, validate the core journeys with seeded accounts and realistic sample data.

1. Visitor discovers a relevant learning path without signing in.
2. Visitor understands why joining a Learning Space is useful.
3. Learner can identify their current learning goal and next action immediately.
4. Learner can complete a lesson and understand the resulting progress state.
5. Learner can save a personal note and clearly distinguish saved vs unsaved state.
6. Creator can understand and manage their Learning Space without exposing platform-admin operations.
7. Moderator can review relevant member/content actions without unnecessary complexity.
8. Platform admin can perform protected platform operations deliberately and visibly.
9. Every main route has understandable loading, empty, success, and error states.
10. Desktop and mobile layouts remain coherent across the full journey.

## Product Decisions Still Needed

These decisions should be made before implementing the corresponding feature, rather than blocking the current product-experience work:

1. Should new paths remain private and pending review, or should some users be allowed to publish immediately?
2. Which platform-admin actions require audit history?
3. Should notes be visible to all approved path members or only to their author?
4. Should Community Progress display names, avatars, or anonymous rankings?
5. Should moderators manage approvals only, or also moderate feedback and content?
6. What community model should be used first: open discussion, cohorts, or focused study groups?
7. What is the first React Native workflow: learner tracking, path discovery, or administration?
8. What license and contribution policy should the public repository use?

## Guardrails for Future Work

- Do not create duplicate documentation for the same architectural/product decision; update the existing canonical files in `docs/`.
- Do not change database schema, RLS, authentication, API contracts, or tenant boundaries as part of a UI-only task unless explicitly requested.
- Reuse existing APIs and components wherever practical.
- Do not invent product metrics or claim functionality that is not implemented.
- Do not introduce a second tenant hierarchy merely to support Learning Space terminology.
- Keep the product focused on learning, collaboration, progress, and useful next actions.
