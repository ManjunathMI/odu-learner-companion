# Business Guide

## Product Vision

ODU Learner Companion is a collaborative learning companion for students, working professionals, and lifelong learners.

> **Learn anything. Together.**

ODU helps people discover what they want to learn, find or create a learning community around that goal, follow a structured learning path, collaborate with other learners, track progress, and eventually use AI assistance to improve the learning experience.

ODU is **not** positioned as a traditional course marketplace or a generic social network. Structured learning paths provide direction; collaboration provides motivation, context, and shared knowledge.

## Product Positioning

Primary message:

> **Learn anything. Together.**

Supporting message:

> A collaborative learning companion for students, professionals, and lifelong learners.

Core emotional proposition:

> **You don't have to learn alone.**

Core experience:

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

## Product Vocabulary

| Technical/current concept | Product language |
|---|---|
| Public wall | Explore / Learning Wall |
| Learning path | Learning Path |
| Path membership | Join a Learning Space |
| My Paths | My Journey |
| Path board | Learning Space |
| Notes | Personal Notes |
| Leaderboard | Community Progress |
| Path admin | Space Creator / Facilitator |
| Platform admin | Platform Admin / Super Admin |

### Learning Path

A Learning Path is a structured sequence of phases, days, and lesson items that helps a learner progress toward a skill, certification, or other defined outcome.

Any registered user may create a Learning Path. On creation, the creator automatically receives an approved `admin` membership for that path through the database trigger.

### Learning Space

A Learning Space is the collaborative learning experience around a Learning Path. It is a product/UX concept, not a new database tenant boundary at this stage.

The current `learning_paths` record remains the tenant root. A Learning Space can expose, over time:

- Learning plan
- Members
- Discussions
- Shared resources
- Study sessions
- Challenges
- Progress
- Announcements

Only capabilities that are actually implemented should be shown as active functionality.

### Learning Journey

My Journey is the learner's personal view of:

- Current learning goals
- Active Learning Paths / Spaces
- Progress
- Next useful action
- Personal Notes
- Future achievements and milestones

The purpose is to answer **"What am I learning and what should I do next?"**, rather than merely listing memberships.

### Learning Wall

The Learning Wall is a learning-focused discovery surface, not a generic social-media feed. It should help learners discover public paths and, later, useful learner-generated knowledge.

## Users and Roles

ODU has two levels of authority: a platform-level administrator and path-scoped roles. Path roles are stored per `path_id`, so the same user can hold different roles on different Learning Paths simultaneously.

### Visitor

A visitor is unauthenticated. A visitor can:

- Understand the ODU proposition.
- Search and browse approved public Learning Paths.
- View public path metadata and overview information.
- Explore topics.
- Sign in to join or participate.

A visitor cannot view private content, member-only learner activity, or protected operations.

### Learner

A Learner is an approved `learner` membership on a specific path. A learner can:

- Join approved Learning Spaces after the membership workflow allows it.
- View the learning plan for paths they are approved to access.
- Mark their own lesson progress.
- Add Personal Notes.
- View permitted Community Progress information.
- Participate in community features as they become implemented.

### Moderator

A Moderator is a path-scoped delegated operator. A moderator can manage the capabilities explicitly granted for that path, including membership-request review where the current implementation allows it.

A moderator does **not** have all permissions of the Path Admin. In particular, moderator status must not imply unrestricted path metadata, learning-plan, or platform-administration rights.

### Space Creator / Path Admin

Any registered user can create a Learning Path and automatically becomes its path admin through the database trigger.

A Path Admin is scoped to one path and can, subject to the current authorization model:

- Edit path title, description, tags, and visibility.
- Manage the Learning Path plan.
- Review and manage membership within the path.
- Delegate appropriate moderator responsibilities.
- Manage the Learning Space experience for that path.

Being a Path Admin does **not** make the user a Platform Admin.

### Platform Admin / Super Admin

A Platform Admin is a platform-level operator stored in `platform_admins`. This role is separate from every path membership.

Platform Admin responsibilities include platform-wide operations such as:

- Reviewing newly created Learning Paths that request public publication.
- Approving, rejecting, or unlisting paths from the public Learning Wall.
- Performing supported platform-level moderation and administration.
- Managing platform-level feedback and other protected operations.

A Platform Admin may have no membership in a given path and may still perform supported platform-level operations. Platform-admin privileges must be implemented through explicit server-side checks and must not be implied by ordinary path membership.

## Path Visibility and Publication Model

Path visibility and platform publication approval are separate concepts.

### Path visibility

The Path Admin chooses whether the path is:

- `private` — accessible only to approved members and authorized operators.
- `public` — eligible for public discovery once platform publication requirements are satisfied.

### Platform publication status

A newly created path can have an independent publication state such as:

- `pending_review`
- `approved`
- `rejected`
- `unlisted`

The current platform rule is that a public Learning Path must receive Platform Admin approval before appearing on the public Learning Wall. A path being marked `public` by its Path Admin does not bypass this review.

The effective discovery condition is:

```text
visibility = public
AND
wall_status = approved
```

A private path remains outside public discovery even if it has an approved publication record; private membership and path access rules continue to apply.

### Create-to-publish workflow

```text
Registered User
      |
      | create Learning Path
      v
Creator automatically becomes Path Admin
      |
      +-----------------------------+
      |                             |
   Private                       Public
      |                             |
      |                      Platform Admin review
      |                             |
      |                     +-------+-------+
      |                     |               |
      |                  Approved        Rejected
      |                     |
      |                     v
      |               Public Learning Wall
      |
      v
Approved members only
```

Changing a path from private to public should not silently bypass the platform publication-review requirement.

## Core Workflows

### Discover and Start Learning

1. A visitor lands on the ODU homepage.
2. The homepage explains the collaborative learning proposition.
3. The visitor searches for a topic or browses approved public Learning Paths.
4. The visitor opens a path overview.
5. The visitor signs in and requests membership where required.
6. Once approved, the path becomes part of My Journey.

### Create a Learning Path / Learning Space

1. An authenticated user submits a title, description, and optional tags.
2. The API inserts a `learning_paths` row with the authenticated user's ID.
3. The `on_path_created` database trigger creates an approved `admin` membership for that creator.
4. The creator manages the plan, visibility, and membership according to the path-admin permissions.
5. If the creator chooses public visibility, the path follows the Platform Admin publication-review workflow before appearing on the public wall.

### Join a Learning Space

1. An authenticated user requests to join a path.
2. The API inserts a pending `path_memberships` row.
3. A moderator or Path Admin reviews the request according to the current permission model.
4. Approval changes the membership to `approved`; rejection changes it to `rejected`.
5. Only approved members can access member-only path content.

### Learn and Track Progress

Progress rows always include `path_id`, `user_id`, and the lesson item key. The API verifies that the lesson belongs to the requested path before writing. This prevents a lesson identifier from being reused to write activity into another tenant.

### My Journey

For an authenticated learner, My Journey should prioritize:

1. Current Learning Paths / Spaces.
2. Progress.
3. The next useful learning action.
4. Pending memberships.
5. Personal Notes and later achievements.

### AI Companion

AI is a supporting capability rather than the product's sole identity. Planned assistance includes actions such as:

- Explain a topic.
- Quiz me.
- Create a learning plan.
- Identify knowledge gaps.
- Suggest what to learn next.

Until these capabilities exist in production, the UI must label them as planned/coming soon rather than implying functionality that is not implemented.

## Profiles and Privacy

Every registered user has a profile separate from authentication identity.

Profiles can contain:

- Display name.
- Avatar.
- Short bio.
- Social links.
- Repository links.
- Badges and achievement history.
- Profile visibility preference.

The default visibility is **joined-paths-only**. A user may explicitly opt into a fully public profile.

Authentication determines who the user is; the `profiles` record determines how the learner is represented in ODU. Product-facing components should prefer profile display data rather than reconstructing identity from auth metadata.

## Badges and Recognition

Badges are a first-class recognition capability and are intended to reinforce learning rather than create points-first gamification.

Badges can be awarded through two mechanisms:

### Automatic recognition

Examples include progress or completion milestones generated from learner activity.

### Manual recognition

Path Admins and authorized Moderators may award recognition within their permitted path scope.

### Audit trail

Every badge award should retain an auditable history containing, as supported by the schema:

- Badge awarded.
- Recipient.
- Award source: automatic or manual.
- Awarding actor when manual.
- Path context when path-specific.
- Timestamp.
- Reason or milestone context where available.

Badge administration and audit history must respect path scope and platform-level authority.

## Business Rules

- Tenant boundaries are defined by `path_id`.
- A user may have different path roles on different Learning Paths simultaneously.
- Any registered user may create a Learning Path and automatically becomes its Path Admin for that path.
- Path Admin and Platform Admin are distinct authorities.
- Moderator is a delegated path-scoped role and does not inherit all Path Admin permissions.
- A path's `public`/`private` visibility is distinct from platform publication approval.
- A public path must have `wall_status = approved` before appearing on the public Learning Wall.
- A private path remains outside public discovery.
- A private path must not reveal its existence to an unauthorized caller; the API returns `404` where this is the intended security behavior.
- A pending or rejected member cannot access member-only path content.
- A user can modify only their own progress.
- Profile visibility defaults to joined-paths-only unless the user explicitly opts into a public profile.
- Badge awards require the appropriate path/platform authority and must preserve auditability.
- The database remains the final authorization boundary through RLS and helper functions.
- User-facing terminology must not imply permissions broader than the underlying authorization model.
- UI may introduce the Learning Space concept without creating a second tenant hierarchy unless a future product decision explicitly requires it.
- Product marketing and UI must not claim features that are not implemented.

## Product Principles

1. **Learning should feel social without becoming a social-media clone.**
2. **The next useful learning action should be obvious.**
3. **AI assists learning; it does not replace the learner community.**
4. **Structured paths provide direction; collaboration provides motivation and context.**
5. **Public discovery should be useful before sign-in.**
6. **Privacy and tenant isolation are product features.**
7. **The interface should feel calm, intelligent, modern, and trustworthy.**
