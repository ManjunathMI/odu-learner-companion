# Business Guide

## What the Product Does

ODU Learner Companion is a multi-tenant learning platform. Each tenant is a learning path: a course, certification journey, onboarding program, or internal capability track. A path owns its content, members, progress, notes, and community activity.

The public wall helps people discover paths that have been made public and approved for listing. Private paths remain discoverable only to approved members or through a direct invitation flow.

## Users and Roles

### Visitor

A visitor can browse the approved public wall and view public path metadata. A visitor cannot view private content, learner activity, or member-only features.

### Learner

An approved learner can:

- View the path plan.
- Mark their own lesson progress.
- Add notes to lesson items.
- View the path leaderboard.
- See other approved members' leaderboard progress without modifying it.

### Moderator

A moderator is scoped to one path. They can review and approve or reject join requests for that path. They do not manage path content or path metadata.

### Path Admin

A path admin is scoped to one path. The path creator becomes an approved admin through the database trigger, not through application code. The admin can:

- Edit path title, description, tags, and visibility.
- Replace the complete learning plan.
- Approve or reject membership requests.
- Manage the path's operational content.

### Platform Admin

A platform admin is a platform-level operator stored in `platform_admins`. This role is separate from path administration and is intended for cross-platform responsibilities such as public-wall moderation and platform-level feedback review.

## Core Workflows

### Sign In

Users sign in with Supabase email OTP or magic-link authentication. No application password is stored or shared. The browser uses Supabase-managed sessions; mobile clients can send the Supabase access token as a Bearer token to the same APIs.

### Create a Path

1. An authenticated user submits a title, description, and optional tags.
2. The API inserts a `learning_paths` row with the authenticated user's ID.
3. The `on_path_created` database trigger creates an approved `admin` membership for that user.
4. The creator can then add the learning plan and manage membership.

### Join a Path

1. An authenticated user requests to join a path.
2. The API inserts a pending `path_memberships` row.
3. A moderator or admin reviews the request.
4. Approval changes the membership to `approved`; rejection changes it to `rejected`.
5. Only approved members can access private content and learner activity.

### Learn and Track Progress

Progress rows always include `path_id`, `user_id`, and the lesson item key. The API verifies that the lesson belongs to the requested path before writing. This prevents a lesson identifier from being reused to write activity into another tenant.

## Business Rules

- Tenant boundaries are defined by `path_id`.
- A user may have different roles on different paths.
- A private path must not reveal its existence to an unauthorized caller; the API returns `404`.
- A pending or rejected member cannot access member-only path content.
- A user can modify only their own progress.
- The database remains the final authorization boundary through RLS and helper functions.
