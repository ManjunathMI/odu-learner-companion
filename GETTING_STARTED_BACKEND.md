# 🔥 GETTING STARTED: Next 15 Minutes

## What You Have
✅ Frontend: Complete, running at http://localhost:3000  
✅ Backend: Complete, 13 API routes ready  
✅ Database: Schema & RLS policies defined (in SQL)  

## What You Need to Do

### 1️⃣ DATABASE SETUP (5 min)

Open Supabase SQL Editor:
1. https://supabase.com → Your Project → SQL Editor
2. Copy ALL SQL from this file: `BACKEND_SETUP.md`
3. Paste and execute each section
   - ✅ CREATE TABLE statements
   - ✅ CREATE INDEX statements
   - ✅ ALTER TABLE RLS statements
   - ✅ CREATE POLICY statements

**That's it for database!**

---

### 2️⃣ ENVIRONMENT SETUP (2 min)

Edit `.env.local`:

```env
# Get these from Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role...    ← Add this!

# Add your admin user UUID (from Supabase Auth → Users)
ADMIN_USER_IDS=your-uuid-here
```

**Critical:** Service role key never goes to frontend!

---

### 3️⃣ RESTART & TEST (2 min)

```bash
# Kill current dev server
# (Ctrl+C in terminal)

# Restart
npm run dev

# Test endpoint
curl http://localhost:3000/api/plans/default
# Should return: {"error": "Course plan not found"}
# ✓ This means API is working!
```

---

### 4️⃣ CREATE FIRST COURSE (3 min)

In browser:
1. Visit http://localhost:3000
2. Make sure you're logged in as admin user
3. Go to `/admin` (admin panel)
4. Click "Create Plan" or similar
5. Fill in:
   - **Room Code:** `default`
   - **Title:** `Your Course Title`
   - **Subtitle:** `Course description`
6. Save

Then test again:
```bash
curl http://localhost:3000/api/plans/default
# Should return your course structure!
```

---

### 5️⃣ TEST FULL FLOW (3 min)

1. **Logout** (from admin account)
2. **Create new email** (use Supabase fake email)
3. **Login** with that email (OTP flow)
4. **Request to join** - Fill the form
5. **Switch back to admin** - Go to `/admin`
6. **Approve request** - Find pending learner, click approve
7. **Switch back to user** - Refresh page
8. **Should redirect to `/tracker`** ✓

---

## 📋 Setup Verification Checklist

After following steps above:

- [ ] Supabase SQL executed (no errors)
- [ ] `.env.local` has SUPABASE_SERVICE_ROLE_KEY
- [ ] `.env.local` has ADMIN_USER_IDS with your UUID
- [ ] `npm run dev` running with no errors
- [ ] `curl http://localhost:3000/api/plans/default` returns 404 (expected)
- [ ] First course created with roomCode='default'
- [ ] `curl` returns your course structure
- [ ] Full flow tested (logout → signup → request → approve → tracker)

---

## 🆘 Common Issues

### Issue: 401 Unauthorized
```bash
curl -H "Authorization: Bearer token-here" \
  http://localhost:3000/api/learners/status
```
**Fix:** Make sure you're logged in on frontend first!

### Issue: 403 Forbidden (on admin endpoints)
**Fix:** Add your user UUID to ADMIN_USER_IDS in .env.local and restart!

### Issue: Course not found
**Fix:** Create a course with roomCode='default' via admin panel!

### Issue: SUPABASE_SERVICE_ROLE_KEY errors
**Fix:** Get it from Supabase Settings → API → Service Role Secret

---

## 📝 Quick Command Reference

```bash
# Start dev server
npm run dev

# Test public endpoint
curl http://localhost:3000/api/plans/default

# Get your UUID (after login, from DevTools)
# Set TOKEN variable
TOKEN="Bearer eyJ..."

# Test protected endpoint
curl -H "Authorization: $TOKEN" \
  http://localhost:3000/api/learners/status

# Test admin endpoint
curl -H "Authorization: $TOKEN" \
  http://localhost:3000/api/admin/me
```

---

## 📚 Full Documentation

After setup, read these in order:
1. **BACKEND_QUICK_REFERENCE.md** - Routes & commands
2. **BACKEND_ARCHITECTURE.md** - How it works
3. **BACKEND_COMPLETE.md** - Full implementation details

---

## ✅ You're Done!

Once verified, you have:
- ✅ Production-ready frontend
- ✅ Production-ready backend API
- ✅ Complete database
- ✅ Working authentication
- ✅ Admin approval system
- ✅ Learner tracking

**Ready to deploy or extend!** 🚀

---

## Next: Deploy to Vercel

When ready:
1. Push to GitHub
2. Import to Vercel
3. Add same env variables
4. Deploy!

Same code, same API, same everything. Just production.

---

**Questions?** Check the detailed docs in the repo root.
