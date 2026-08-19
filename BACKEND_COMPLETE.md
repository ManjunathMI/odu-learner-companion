# Backend API Implementation Complete ✅

## Files Created

All API routes have been implemented in `/app/api/`:

### Public Routes
- ✅ `GET /api/plans/[roomCode]` - Get course structure with nested phases/days/items
- ✅ `GET /api/leaderboard/[roomCode]` - Get learner progress rankings
- ✅ `POST /api/progress` - Save lesson completion status
- ✅ `GET /api/notes/[itemId]` - Get user's notes for an item
- ✅ `POST /api/notes` - Add note to an item
- ✅ `POST /api/learners/request` - Request to join course
- ✅ `GET /api/learners/status` - Check user's approval status
- ✅ `POST /api/feedback` - Submit feedback

### Admin Routes (requires ADMIN_USER_IDS)
- ✅ `GET /api/admin/me` - Verify admin status
- ✅ `GET /api/admin/plans` - List all course plans
- ✅ `POST /api/admin/plans` - Create new course plan
- ✅ `PUT /api/admin/plans/[id]` - Edit plan with nested phases/days/items
- ✅ `DELETE /api/admin/plans/[id]` - Delete course plan
- ✅ `PATCH /api/admin/approvals/[userId]` - Approve/reject learner request
- ✅ `GET /api/admin/feedback` - View all user feedback

### Helper
- ✅ `app/api/lib/supabase.ts` - Supabase client and auth helpers

## Setup Checklist

### 1. Database Setup (Supabase)
Run SQL from `BACKEND_SETUP.md`:
```sql
-- Copy all CREATE TABLE statements
-- Copy all CREATE INDEX statements
-- Copy all RLS policies
```

Step by step:
- [ ] Open Supabase SQL Editor
- [ ] Copy tables SQL and execute
- [ ] Copy indexes SQL and execute
- [ ] Copy RLS policies SQL and execute

### 2. Environment Variables
Update `.env.local`:

```env
# Already have these
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Add these for backend
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_USER_IDS=user-uuid-1,user-uuid-2
```

**To get admin user UUIDs:**
- Go to Supabase Auth → Users
- Copy the UUID of users you want as admins
- Comma-separate them in ADMIN_USER_IDS

### 3. Install Dependencies
If using TypeScript routes, you already have dependencies. If you need to verify:

```bash
npm list @supabase/supabase-js
# Should be v2.39.0 or higher
```

### 4. Test the Backend

Start dev server:
```bash
npm run dev
# Server runs on http://localhost:3000
```

#### Test Public Routes

```bash
# 1. Get course plan
curl http://localhost:3000/api/plans/default

# Should return: { title, subtitle, phases: [...] }
```

#### Test Protected Routes

First, get an auth token from frontend:
1. Visit http://localhost:3000
2. Login with email OTP
3. Open DevTools → Network
4. Find request to `/api/learners/status`
5. Copy the Authorization header value

Then test:
```bash
# Replace TOKEN with the token from header
TOKEN="Bearer your-token-here"

# Test status endpoint
curl -H "Authorization: $TOKEN" http://localhost:3000/api/learners/status

# Should return: { status: 'pending'|'approved'|'unknown', ... }
```

#### Test Admin Routes

```bash
# Add your user ID to ADMIN_USER_IDS in .env.local first
# Then test:

curl -H "Authorization: $TOKEN" http://localhost:3000/api/admin/me
# Should return: { isAdmin: true, userId: "..." }
```

## Frontend Integration Updates

The frontend already has API calls ready. They just need working endpoints:

### Key Frontend API Calls (lib/api.js)

```javascript
// These are already implemented, now they hit real backend:

// Get course plan
get('/plans/default')
// → returns nested structure for tracker display

// Get leaderboard
get('/leaderboard/default')
// → returns sorted learner progress

// Save progress
post('/progress', { itemId, done: true })
// → upserts into progress table

// Check status
get('/learners/status')
// → returns approval status, frontend redirects based on this

// Request to join
post('/learners/request', { name, joinCode })
// → inserts into pending_learners, frontend shows "waiting" state

// Admin approval
patch('/admin/approvals/[userId]', { decision: 'approved'|'rejected' })
// → moves learner from pending to approved
```

## Database Flow Diagrams

### Authentication & Approval Flow
```
User → LoginForm (Supabase Auth) → GET /api/learners/status
                                   → pending? Show waiting message
                                   → approved? Redirect to /tracker
                                   → unknown? Show RequestJoinForm
                              
   → POST /api/learners/request → pending_learners (status='pending')
   
Admin → PATCH /api/admin/approvals/[userId] with 'approved'
        → Inserts into learners table
        → User next check: approved!
```

### Learning Flow
```
Tracker Page → GET /api/plans/[roomCode]
                   → returns phases > days > items structure
            
           → Display in UI (Phase, Day, LessonItem components)
           
LessonItem (checkbox) → POST /api/progress { itemId, done: true }
                      → upserts into progress table
                      
           → GET /api/leaderboard/[roomCode]
                   → counts done=true for each learner
                   → sorts descending
           
           → Display in Leaderboard component
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "descriptive message"
}
```

Status codes:
- `400` - Bad request (missing/invalid fields)
- `401` - Unauthorized (no session)
- `403` - Forbidden (not admin)
- `404` - Not found (plan, learner, item)
- `409` - Conflict (name already taken)
- `500` - Server error

## Common Issues & Fixes

### Issue: 401 Unauthorized on protected routes
**Fix:** Ensure Authorization header is sent:
```javascript
// In frontend, lib/api.js already adds this:
const token = await getAuthToken();
config.headers.Authorization = `Bearer ${token}`;
```

### Issue: 403 Forbidden on admin routes
**Fix:** Check ADMIN_USER_IDS in .env.local contains your user UUID

### Issue: Course plan returns 404
**Fix:** Ensure you created a course plan with room_code='default' in admin panel

### Issue: Name already taken error on join request
**Fix:** This is expected! User tried to use a name someone else already used in that course

## Next Steps

1. **Run Database Setup** - Execute all SQL from BACKEND_SETUP.md in Supabase
2. **Add Environment Variables** - Set SUPABASE_SERVICE_ROLE_KEY and ADMIN_USER_IDS
3. **Create Initial Data** - Use admin panel to create first course plan
4. **Test Each Endpoint** - Use curl or Postman with the test commands above
5. **Monitor Errors** - Check server console output for detailed error messages
6. **Deploy** - When ready, deploy to Vercel/production with same env vars

## Architecture Summary

```
Frontend (Next.js App Router)
    ↓ (HTTP requests with Bearer token)
API Routes (app/api) ← You are here!
    ↓ (Supabase JS client)
Supabase PostgreSQL (with RLS policies)
    ↓ (enforces access control)
Response back to frontend
```

All routes:
- ✅ Verify session server-side
- ✅ Validate request bodies
- ✅ Check admin permissions where needed
- ✅ Return consistent error format
- ✅ Use RLS policies for data security

**Ready to test!** 🚀
