# Product Roadmap

This roadmap records the next product phases after the current Phase 1 multi-tenant foundation.

## Current State: Phase 1 Foundation

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
- Public documentation and API contracts.
- Bearer-token-compatible API design for a future React Native client.

The canonical database schema remains the source of truth for tenant isolation and role behavior.

## Phase 2: Product Usability and Administration

### Visual Plan Editor

Replace the JSON plan editor with a guided interface:

- Add, remove, and reorder phases.
- Add, remove, and reorder days.
- Add, remove, and reorder lesson items.
- Validate required fields before saving.
- Preview the learner experience.
- Warn before replacing an existing plan.

### Platform Admin Console

Add server-backed platform administration:

- Review paths requesting public listing.
- Approve, reject, or unlist paths.
- View platform-level feedback.
- Manage platform admins through a protected operation.
- Keep platform-admin access separate from path-admin access.

### Profiles

Use the existing `profiles` table to add:

- Display name.
- Avatar.
- Short bio.
- Social links.
- Repository links.
- Visibility preferences.

### Better Membership Management

Add path-admin controls for:

- Promoting an approved learner to moderator.
- Demoting a moderator.
- Removing a member.
- Viewing member display names instead of UUIDs.
- Showing pending, approved, and rejected states clearly.

## Phase 3: Production Readiness

- Automated tests for API authorization and tenant isolation.
- Integration tests against a disposable Supabase project.
- Structured server logging without credentials or personal data.
- Error monitoring and alerting.
- Rate limiting for authentication, join requests, feedback, and write endpoints.
- Pagination for wall, members, notes, and leaderboard data.
- Database indexes reviewed against real query patterns.
- Staging and production Supabase projects.
- Backup and recovery procedure.
- CI build and lint checks.
- Secure deployment environment configuration.

## Phase 4: Mobile Client

Build React Native clients for Android and iOS using the existing APIs:

- Supabase mobile authentication and secure session storage.
- Shared path, membership, plan, progress, notes, and leaderboard contracts.
- Native navigation and offline-friendly read caching.
- Retry handling for progress updates.
- Push-notification foundation if notifications become part of the product.

The mobile client should not access the database directly. It should use the same server API and authorization rules as the web client.

## Phase 5: Engagement and Recognition

The schema already reserves space for badges:

- Automatic completion badges.
- Manual moderator/admin awards.
- Path-specific and platform-wide badges.
- Learner achievement history.

Potential future additions:

- Milestones.
- Streaks.
- Certificates.
- Cohort announcements.
- Completion analytics.

## Product Decisions Still Needed

Before Phase 2 implementation, decide:

1. Should new paths remain private and pending review, or should some users be allowed to publish immediately?
2. Which platform-admin actions require audit history?
3. Should notes be visible to all approved path members or only to their author?
4. Should leaderboard display names, avatars, or anonymous rankings?
5. Should moderators manage approvals only, or also moderate feedback and content?
6. What is the first React Native workflow: learner tracking, path discovery, or administration?
7. What license and contribution policy should the public repository use?
