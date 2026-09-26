# How to Use ODU Learner Companion

ODU Learner Companion is a collaborative learning product for students, working professionals, and lifelong learners.

Primary message:

> **Learn anything. Together.**

The product helps people discover a learning goal, join or create a Learning Space, follow a structured Learning Path, track progress, and learn with other people.

## What the app can do today

The current implementation supports:

- Public discovery of approved Learning Paths.
- Email OTP sign-in with Supabase.
- A personal **My Journey** dashboard for signed-in learners.
- User-created Learning Paths.
- Structured plans made of phases, days, and lesson items.
- Learning Space membership requests and approvals.
- Path-scoped progress tracking.
- Personal Notes on lesson items.
- Path settings and curriculum management for authorized path admins.
- Platform-admin review for public-path publication and creator quota requests.
- Profile management for display name, avatar, bio, and link preferences.

The product does **not** yet provide live AI assistance, discussions, cohorts, badges, or mobile apps as finished end-user features. Treat those as planned, not available.

## Core product concepts

### Explore / Learning Wall

This is the public discovery surface. Visitors can browse approved public Learning Paths before signing in.

### Learning Path

A Learning Path is the structured curriculum. It contains:

```text
Phase -> Day -> Lesson item
```

### Learning Space

A Learning Space is the collaborative experience around a Learning Path. It is the place where members learn, track progress, and participate under path-specific roles.

### My Journey

My Journey is the signed-in learner dashboard. It shows active Learning Paths, progress, pending requests, and the next useful action.

## Who uses the app

### Visitor

A visitor can:

- Open the homepage.
- Explore approved public Learning Paths.
- Review public path information.
- Start the sign-in flow.

### Learner

A learner can:

- Join a Learning Space by requesting membership when needed.
- Open approved Learning Spaces.
- View the learning plan for paths they can access.
- Track lesson progress.
- Add Personal Notes.
- View Community Progress where available for approved members.

### Moderator

A moderator can:

- Review membership requests for the paths they moderate.
- Perform only the path-scoped moderation actions supported by the current product.

### Path Admin / Space Creator

A path admin can:

- Create a Learning Path.
- Edit path title, description, tags, and visibility.
- Build and update the curriculum structure.
- Review and manage path members.
- Promote or demote moderators where the current implementation allows it.

### Platform Admin

A platform admin can:

- Review public-path publication requests.
- Approve, reject, or unlist public Learning Paths.
- Review creator quota increase requests.

Platform Admin is separate from Path Admin. Owning a path does not make a user a platform admin.

## Typical user journeys

### 1. Discover a Learning Path

1. Open the homepage or go to `/explore`.
2. Browse public Learning Paths.
3. Use the search box or tag filters to narrow the list.
4. Open a Learning Path to review it.
5. Choose **Start learning** or request access when you are ready to join.

### 2. Sign in

1. Go to `/auth` or choose **Start learning**.
2. Enter your email address.
3. Receive a one-time verification code.
4. Enter the 6-digit code.
5. After sign-in, you are sent to **My Journey**.

### 3. Join a Learning Space

1. Open a Learning Path.
2. Select **Request to join** if you are not already a member.
3. Wait for a moderator or path admin to review the request.
4. Once approved, the path appears in **My Journey**.

### 4. Learn inside a Learning Space

1. Open the path from **My Journey**.
2. Review the phases, days, and lesson items.
3. Open learning resources from each lesson item.
4. Mark lesson items complete as you progress.
5. Add Personal Notes to capture useful ideas or reminders.
6. Review Community Progress to compare completion across approved members.

### 5. Create a Learning Path

1. Sign in.
2. Open **My Journey**.
3. Choose **Create a Learning Path**.
4. Add a title, description, and tags.
5. Build the curriculum using phases, days, and lesson items.
6. Save the path and continue in path settings.

Creating a path makes the creator the approved path admin for that path.

### 6. Manage a Learning Path

Path admins can open the path settings screen to:

- Edit the path overview.
- Change path visibility between private and public.
- Build or update the learning plan.
- Review the member list.
- Promote moderators.
- Remove members when necessary.

Changing a path to `public` does not automatically place it on the public wall. Public discovery depends on platform-admin publication review.

### 7. Review membership requests

Moderators and path admins can:

1. Open the approvals view for a path.
2. Review pending join requests.
3. Approve or reject requests.

### 8. Manage your account and profile

Use `/account` to:

- Review your current roles.
- See which Learning Paths you lead.
- See which Learning Paths you participate in.
- Review creator capacity and quota-request state.

Use `/profile` to:

- Update your display name.
- Set an avatar URL.
- Add a short bio.
- Add social and repository links.
- Choose profile visibility.

## Current routes users should know

- `/` — homepage
- `/explore` — public Learning Wall
- `/auth` — sign-in
- `/journey` — My Journey
- `/account` — account and creator capacity
- `/profile` — profile editor
- `/paths/[pathId]` — Learning Space
- `/paths/[pathId]/settings` — path settings for authorized admins
- `/paths/[pathId]/approvals` — membership approvals for authorized moderators/admins
- `/admin` — protected platform admin workspace

## What to tell new users

If you are introducing the product to a beta user, the shortest explanation is:

1. **Explore** a goal you care about.
2. **Join** an existing Learning Space or **create** your own Learning Path.
3. **Learn step by step** through the curriculum.
4. **Track progress** and keep Personal Notes.
5. **Collaborate** with other members through shared path membership and community progress.

## Current limitations and expectations

- AI Companion features are planned, not live.
- Badges and advanced recognition are not yet exposed as a complete end-user workflow.
- Community features such as discussions, cohorts, and announcements are still future work.
- Access to private Learning Spaces depends on approval and path membership.
- Public discovery is limited to paths that are both public and platform-approved.

## Related documentation

- [Business Guide](business-guide.md)
- [Architecture](architecture.md)
- [Product Roadmap](roadmap.md)
- [API Reference](api.md)
- [Development Guide](development.md)
