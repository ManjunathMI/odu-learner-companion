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

The database trigger creates the creator's approved admin membership.

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
