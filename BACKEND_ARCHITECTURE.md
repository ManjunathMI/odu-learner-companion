# Backend Architecture & File Structure

## Backend Technology Stack

**Same Next.js App Router** as frontend:
- Location: `/app/api` (API Route Handlers)
- Framework: Next.js 16.3.0 (App Router)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (server-side session verification)
- HTTP Client: Supabase JS with service role key

## Why Build Backend in Next.js API Routes

✅ **Same codebase** - Frontend and backend in one repo  
✅ **Simplified deployment** - Single Next.js app to Vercel/similar  
✅ **No CORS issues** - API and frontend same origin  
✅ **Shared utilities** - Auth, DB client in lib/ folder  
✅ **Type safety** - TypeScript for both layers  

## File Structure

```
app/
├── api/
│   ├── lib/
│   │   └── supabase.ts              # Supabase server client helper
│   │
│   ├── plans/
│   │   ├── [roomCode]/
│   │   │   └── route.ts             # GET /api/plans/[roomCode]
│   │   └── route.ts                 # POST /api/plans (admin only)
│   │
│   ├── leaderboard/
│   │   └── [roomCode]/
│   │       └── route.ts             # GET /api/leaderboard/[roomCode]
│   │
│   ├── progress/
│   │   └── route.ts                 # POST /api/progress
│   │
│   ├── notes/
│   │   ├── [itemId]/
│   │   │   └── route.ts             # GET /api/notes/[itemId]
│   │   └── route.ts                 # POST /api/notes
│   │
│   ├── learners/
│   │   ├── request/
│   │   │   └── route.ts             # POST /api/learners/request
│   │   ├── status/
│   │   │   └── route.ts             # GET /api/learners/status
│   │   └── route.ts                 # (future: list learners)
│   │
│   ├── feedback/
│   │   └── route.ts                 # POST /api/feedback
│   │
│   └── admin/
│       ├── me/
│       │   └── route.ts             # GET /api/admin/me
│       ├── plans/
│       │   ├── [id]/
│       │   │   └── route.ts         # PUT/DELETE /api/admin/plans/[id]
│       │   └── route.ts             # POST /api/admin/plans
│       ├── approvals/
│       │   └── [userId]/
│       │       └── route.ts         # PATCH /api/admin/approvals/[userId]
│       └── feedback/
│           └── route.ts             # GET /api/admin/feedback

lib/
├── auth.js                          # Supabase client (frontend + server)
├── api.js                           # Axios client (frontend only)
└── utils.js                         # Shared utilities
```

## Key Implementation Patterns

### 1. Supabase Server Client Helper
```typescript
// app/api/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Service role client (admin operations)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to verify session from request
export async function getSession(req: Request) {
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

// Check if user is admin
export function isAdmin(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',');
  return adminIds.includes(userId);
}
```

### 2. Error Response Pattern
```typescript
// All errors return consistent JSON
{ error: "descriptive message" }  // 400, 401, 403, 404, 500
```

### 3. Request Validation
```typescript
// Validate body before DB operations
function validateRequest(body: any, requiredFields: string[]) {
  for (const field of requiredFields) {
    if (!body[field]) {
      throw new Error(`Missing field: ${field}`);
    }
  }
}
```

### 4. Response Pattern
```typescript
// Success responses return data directly
return Response.json(data)

// Errors return error object
return Response.json({ error: message }, { status: 400 })
```

## API Endpoint Summary

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/plans/:roomCode` | Public | Get course structure |
| GET | `/api/leaderboard/:roomCode` | Public | Get progress leaderboard |
| POST | `/api/progress` | User | Save lesson completion |
| GET | `/api/notes/:itemId` | User | Get item notes |
| POST | `/api/notes` | User | Add note to item |
| POST | `/api/learners/request` | User | Request to join |
| GET | `/api/learners/status` | User | Check approval status |
| POST | `/api/feedback` | User | Submit feedback |
| GET | `/api/admin/me` | Admin | Check admin status |
| POST | `/api/admin/plans` | Admin | Create course plan |
| PUT | `/api/admin/plans/:id` | Admin | Edit course + nested items |
| PATCH | `/api/admin/approvals/:userId` | Admin | Approve/reject learner |
| GET | `/api/admin/feedback` | Admin | View all feedback |

## Frontend ↔ Backend Data Flow

**Login Flow:**
```
Frontend: LoginForm → POST /auth/otp (Supabase handles)
Frontend: Verify OTP → POST /auth/verify (Supabase handles)
Frontend: GET /api/learners/status → Backend checks DB
```

**Join Flow:**
```
Frontend: RequestJoinForm → POST /api/learners/request
Backend: Validate name uniqueness, insert into pending_learners
Frontend: Polls GET /api/learners/status until approved
```

**Learning Flow:**
```
Frontend: Click checkbox → POST /api/progress {itemId, done: true}
Backend: Upsert into progress table
Frontend: GET /api/leaderboard/:roomCode → Show rankings
```

**Admin Flow:**
```
Frontend: Admin panel → GET /api/admin/me (verify admin)
Frontend: Create phase → POST /api/admin/plans
Backend: Insert course_plans + phases + days + items (nested)
```

## Next Steps

1. ✅ Create `app/api/lib/supabase.ts` - Helper functions
2. ✅ Create all route handlers one by one
3. ✅ Test each endpoint with curl/Postman
4. ✅ Connect frontend API calls to working backend
