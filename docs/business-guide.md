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

The following vocabulary is the canonical user-facing language. Existing database/table names do not need to change merely because the UX terminology changes.

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
| Platform admin | Platform Admin |

### Learning Path

A Learning Path is a structured sequence of phases, days, and lesson items that helps a learner progress toward a skill or outcome.

Examples:

- AI Learning Foundations
- Java Microservices
- AWS Certification
- Product Management Fundamentals

A Learning Path may be public or private according to the existing visibility and approval rules.

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

Only capabilities that are actually implemented should be shown as active functionality in the UI.

### Learning Journey

My Journey is the learner's personal view of:

- Current learning goals
- Active Learning Paths / Spaces
- Progress
- Next useful action
- Notes
- Future achievements and milestones

The purpose is to answer **"What am I learning and what should I do next?"**, rather than merely listing memberships.

### Learning Wall

The Learning Wall is a learning-focused discovery surface, not a generic social-media feed. It should help learners discover public paths and, later, useful learner-generated knowledge such as:

- What I am learning
- What I discovered
- What I am struggling with
- Something I can teach
- Something I built

## Users and Roles

### Visitor

A visitor can:

- Understand the ODU proposition.
- Search and browse approved public learning paths.
- View public path metadata and overview information.
- Explore topics.
- Sign in to join or participate.

A visitor cannot view private content, member-only learner activity, or protected operations.

### Learner

An approved learner can:

- Enter approved Learning Spaces.
- View the learning plan.
- Mark their own lesson progress.
- Add personal notes.
- View community progress / leaderboard information allowed by the product.
- Participate in future collaborative learning capabilities as those features are implemented.

### Moderator

A moderator is scoped to one Learning Space / path. They can review and approve or reject join requests for that path. They do not manage path content or path metadata unless a separate role grants those capabilities.

### Space Creator / Path Admin

A path admin is scoped to one path. The path creator becomes an approved `admin` membership through the database trigger, not through application code.

The admin can:

- Edit path title, description, tags, and visibility.
- Replace the complete learning plan.
- Approve or reject membership requests.
- Manage the path's operational content.

Future terminology may expose this role as the Learning Space Creator or Facilitator while retaining the existing authorization model.

### Platform Admin

A platform admin is a platform-level operator stored in `platform_admins`. This role is separate from path administration and is intended for cross-platform responsibilities such as public-wall moderation and platform-level feedback review.

Platform-admin operations remain deliberately separated from normal learner navigation.

## Core Workflows

### Discover and Start Learning

1. A visitor lands on the ODU homepage.
2. The homepage explains the collaborative learning proposition.
3. The visitor can search for a learning topic or browse public Learning Paths.
4. The visitor opens a path overview.
5. The visitor signs in and requests membership where required.
6. Once approved, the path becomes part of the learner's Journey.

### Create a Learning Space

1. An authenticated user submits a title, description, and optional tags.
2. The API inserts a `learning_paths` row with the authenticated user's ID.
3. The `on_path_created` database trigger creates an approved `admin` membership for that user.
4. The creator can add the learning plan and manage membership.
5. The resulting path can be presented as a Learning Space in the user experience.

### Join a Learning Space

1. An authenticated user requests to join a path.
2. The API inserts a pending `path_memberships` row.
3. A moderator or admin reviews the request.
4. Approval changes the membership to `approved`; rejection changes it to `rejected`.
5. Only approved members can access private content and learner activity.

### Learn and Track Progress

Progress rows always include `path_id`, `user_id`, and the lesson item key. The API verifies that the lesson belongs to the requested path before writing. This prevents a lesson identifier from being reused to write activity into another tenant.

### My Journey

For an authenticated learner, the Journey should prioritize:

1. Current Learning Paths / Spaces.
2. Progress.
3. The next useful learning action.
4. Pending memberships.
5. Personal notes and later achievements.

The user should not have to interpret database concepts such as memberships or tenant IDs to understand their learning state.

### AI Companion

AI is a supporting capability rather than the product's sole identity. Planned assistance includes actions such as:

- Explain a topic.
- Quiz me.
- Create a learning plan.
- Identify knowledge gaps.
- Suggest what to learn next.

Until these capabilities exist in production, the UI must label them as planned/coming soon rather than implying functionality that is not implemented.

## Curated Learning Paths

Learning paths may use an original curriculum assembled from reputable primary learning resources. Existing curated paths remain governed by the current content and licensing rules.

External products can inform general interaction patterns such as roadmap discovery, resource libraries, focused next-step actions, and supportive motivation. Do not copy another product's curriculum text, proprietary content, identity, or visual assets into an ODU learning path.

## Business Rules

- Tenant boundaries are defined by `path_id`.
- A user may have different roles on different paths.
- A private path must not reveal its existence to an unauthorized caller; the API returns `404`.
- A pending or rejected member cannot access member-only path content.
- A user can modify only their own progress.
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
