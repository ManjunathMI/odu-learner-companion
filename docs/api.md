# API Reference

All API responses are JSON. Errors use `{ "error": "message" }`. Protected endpoints accept either the SSR cookie session or `Authorization: Bearer <supabase-access-token>`.

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

## Platform Admin Quota Review

- `GET /api/admin/quota-requests` — Platform Admin only; lists requests with requester profile data.
- `POST /api/admin/quota-requests/:requestId` with `{ "decision": "approved" }` or `{ "decision": "rejected" }` — Platform Admin only.

Approval and request audit updates are performed by the transactional `review_quota_request` database function. Normal users cannot modify their own entitlement.

## Path Content

- `GET /api/paths/:pathId/plan` — approved members read the nested plan.
- `PUT /api/paths/:pathId/plan` — path admins replace phases, days, and items.
- `PUT /api/paths/:pathId` — path admins update metadata and visibility.

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
- `GET /api/paths/:pathId/notes/:itemId` returns notes for an item.
- `POST /api/paths/:pathId/notes` with `{ "itemId": "uuid", "text": "..." }`.

All activity endpoints verify approved membership and validate that the lesson belongs to the requested path.
