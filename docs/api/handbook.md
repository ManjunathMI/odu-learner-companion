# API Reference

All API responses are JSON. Errors use `{ "error": "message" }`. Protected endpoints authenticate in their own handlers and accept either the SSR cookie session or `Authorization: Bearer <supabase-access-token>`.

## Public

### `GET /api/wall`

Returns public paths with `wall_status = 'approved'`:

```json
[{"id":"uuid","title":"...","description":"...","tags":[],"memberCount":0,"createdAt":"..."}]
```

### `GET /api/paths/:pathId`

Returns public path metadata. Private paths return `404` to unauthorized callers.

### `POST /api/paths`

Authenticated users create a path:

```json
{"title":"AWS Certification","description":"...","tags":["aws","cloud"]}
```

The database transaction enforces the user's `user_entitlements.max_created_paths` against the current count of paths where `created_by` is the authenticated user. Concurrent create requests are serialized per user. The database trigger creates the creator's approved admin membership. Joining an existing path does not consume creator quota.

### `DELETE /api/paths/:pathId`

An authenticated approved Path Admin can delete their own path. The server checks the approved `admin` membership through the existing path authorization helper; `created_by` alone is not sufficient. Cascading foreign keys remove dependent path data according to the existing schema.

## Account and Creator Capacity

- `GET /api/account` returns profile identity, approved path memberships grouped by role, Platform Admin status, and derived creator usage/entitlement.
- `GET /api/quota-requests` returns the authenticated user's quota-request history.
- `POST /api/quota-requests` creates a request for a higher limit. `requested_limit` must be greater than the current entitlement, and only one pending request is allowed per user.

Quota requests do not add payment or subscription behavior. Entitlements remain separate from path roles.

## Owner Workspace Quota Review

- `GET /api/admin/quota-requests` — Platform owner only; lists requests with requester profile data.
- `POST /api/admin/quota-requests/:requestId` with `{ "decision": "approved" }` or `{ "decision": "rejected" }` — Platform owner only.

Approval and request audit updates are performed by the transactional `review_quota_request` database function. Normal users cannot modify their own entitlement.

## Path Content

- `GET /api/paths/:pathId/plan` — approved members read the nested plan.
- `PUT /api/paths/:pathId/plan` — path admins save phases, days, and items atomically. Retain the IDs returned by GET for existing nodes; omit IDs only for new nodes. Send `revision` from GET for an existing curriculum and `confirmRemovals: true` only after explicit removal confirmation. Stale revisions return 409; malformed content returns 400. Retained lessons keep progress and notes. GET and successful PUT return `{ revision, phases }`. Initial creation may omit revision only while the stored curriculum is empty. The old success-only PUT response is replaced by the saved snapshot.
- `PUT /api/paths/:pathId` — path admins update metadata and visibility. Optional `overviewMarkdown` accepts text or null (maximum 100,000 characters); GET returns it as part of the metadata.

After applying `20261029182558_learning_material.sql`, each day in the plan may contain nullable `contentMarkdown` (maximum 100,000 characters). GET and successful PUT include it. Omit the key to preserve existing lesson material when saving older payloads; send null or an empty string to clear it. The existing 1 MiB plan body limit, membership checks, revision and removal rules still apply. This extension is prepared offline and is not yet applied to the hosted project.

Plan shape:

```json
{"phases":[{"title":"Phase 1","goal":"...","days":[{"dayLabel":"Day 1","title":"...","hours":"2","items":[{"title":"...","url":"...","tag":"hands"}]}]}]}
```

## Membership

- `POST /api/paths/:pathId/join` — authenticated user creates a pending membership.
- `GET /api/paths/:pathId/approvals` — moderator/admin reads pending requests.
- `POST /api/paths/:pathId/approvals/:userId` — moderator/admin sends `{ "decision": "approved" }` or `{ "decision": "rejected" }`.

## Learning Activity

- `POST /api/paths/:pathId/progress` with `{ "itemId": "uuid", "done": true }`.
- `GET /api/paths/:pathId/leaderboard` returns approved members sorted by completion.
- `GET /api/paths/:pathId/notes` returns the caller's saved note history for the path, newest first, with note `id` and `itemId`.
- `GET /api/paths/:pathId/notes/:itemId` returns only the caller's notes for an item, including for Platform Admin callers.
- `POST /api/paths/:pathId/notes` with `{ "itemId": "uuid", "text": "..." }`.

Activity endpoints verify approved membership. Writes validate that the lesson belongs to the requested path. Notes are personal; reads filter by the caller as well as the path. Direct browser writes to paths, memberships, curriculum, progress, and notes are revoked; use the server endpoints, or the explicitly authorized creator-entitlement RPC for path creation.

## Documentation publishing

GET /api/admin/documents is owner-only. It registers deployed Git Markdown sources as restricted drafts without overwriting existing settings and returns catalogue metadata. PATCH /api/admin/documents accepts source_path, visibility (public or platform_admin), and status (draft, published or archived). Technical sources remain platform_admin-only. These endpoints never create or edit files, fetch arbitrary URLs or commit to Git. Article rendering independently enforces visibility; drafts are owner previews only.
