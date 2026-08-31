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

### Role-Based Navigation and Product Journey Validation

Before broadening the feature list, harden the user experience for each persona:

- Keep the public wall focused on discovery and sign-in.
- Put profile and admin actions in the authenticated user menu, not in the visible top nav.
- Validate the complete journey for visitor, learner, path admin, and platform admin.
- Seed test bed accounts and sample path data so the app can be reviewed visually by role.
- Confirm the product feels coherent across authenticated and unauthenticated states.

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

## UI/UX Review Backlog

### Design Direction Agreed

The product should feel clean, structured, motivating, and trustworthy. The interface should prioritize the learner's next useful action, present role-specific controls only where relevant, and make system status plain without relying on decorative UI.

The visual system uses a restrained ink-and-cobalt palette with sage reserved for positive progress, an editorial display face for headings, and an Avenir-style interface face for controls and body text. Primary actions use a consistent solid treatment; secondary actions remain quiet, bordered controls. This decision applies to all future screens and prevents page-specific visual drift.

Public research note: AIParth's unauthenticated shell was reviewed for interaction patterns only. Its roadmap and library discovery routes, personal learning area, focused path-finding action, and daily-growth prompt reinforce the product direction toward structured discovery and personal progress. ODU Learner Companion will use these as general design signals only, and will not copy AIParth curriculum content, branding, copy, or visual assets.

The public AIParth software-engineer sprint roadmap was also reviewed for its high-level progression pattern: scoped sprint duration, a concrete outcome, ordered competency arcs, and a capstone. ODU Learner Companion now includes its own `AI-Enabled Software Engineering Sprint` path using original content, public resources, and a four-phase sequence for AI-assisted development, integration, bounded workflows, and portfolio delivery.

### Completed in the First UI/UX Pass

- Refreshed the public wall with an explicit discovery hierarchy and scannable path summaries.
- Refreshed My Paths as a personal workspace with distinct active, pending, and empty states.
- Kept public navigation focused on Wall and My paths; account, profile, and platform-admin actions remain in the authenticated user menu.

### Completed in the Learner Board and Admin Access Pass

- Restored each approved member's completed lessons when loading a path and added a progress summary with the next lesson.
- Added explicit note-saving feedback so a learner can distinguish an unsaved edit from a saved note.
- Made platform-admin access an explicit override in the shared path authorization helpers; a platform admin can open and manage any path while normal users remain constrained by path membership and role.
- Added public-wall search and topic filtering using the existing public path data, including an explicit no-results state.
- Added GitHub Actions continuous integration to run the repository lint and production-build checks on pull requests and pushes to `main`.

### Next UI/UX Review Items

1. Path board: add visible progress summary, clearer current/next lesson state, and calmer lesson completion controls.
2. Path board: make notes feedback explicit and distinguish saved notes from unsaved edits.
3. Path settings: separate metadata, plan editing, and membership management into clearer working areas; add save-state feedback and destructive-action confirmation.
4. Admin workspace: improve path-review context, approval decisions, and empty/error states; establish a deliberate audit-history design once the product decision is made.
5. Account experience: review profile editing, menu behavior, session loading, and mobile navigation for each seeded user role.
6. Discovery: evaluate search, filtering, tags, and no-result states after the initial visual flow is validated with real path data.
7. Accessibility: complete keyboard navigation, visible focus states, contrast review, and screen-reader labels for menus, tabs, status badges, and editor actions.

### UI/UX Validation Checklist

- Review visitor, learner, moderator, path-admin, and platform-admin flows using the seeded test accounts.
- Check desktop and mobile layouts at each main route: Wall, My Paths, Path Board, Path Settings, Profile, and Admin.
- Confirm that every status has an understandable empty, loading, success, and error state.
- Confirm roles expose only useful actions, while platform-admin operations remain visibly deliberate.

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
