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

## Current State: Foundation

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

Existing databases must apply the additive schema statements documented in `docs/database-operations.md`. The canonical creation schema is `docs/DB-schema.sql`.

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
