# ODU Learner Companion - Code Review & Required Changes

## Summary
The current codebase has **significant structural and implementation issues** that need to be addressed. The project is partially built but has several critical problems preventing it from meeting the requirements.

---

## 🔴 CRITICAL ISSUES

### 1. **Mixed Router Systems** ⚠️
- **Problem**: Project has both `/pages` (Pages Router) and `/app` (App Router) directories
- **Issue**: This causes routing conflicts and confusion
- **Required Fix**: Remove entire `/pages` directory; all routing must go through `/app` with App Router
- **Severity**: CRITICAL - Must fix before anything else

### 2. **Wrong Authentication Library**
- **Current**: Using `next-auth/react` (NextAuth)
- **Required**: Supabase Auth client library
- **Problem**: 
  - No `@supabase/supabase-js` or `@supabase/auth-helpers-nextjs` in package.json
  - Missing Supabase environment variables setup
  - Auth flow doesn't implement OTP/magic link as specified
- **Severity**: CRITICAL

### 3. **Incorrect Folder Structure**
- **Current**:
  ```
  app/
    layout.tsx
    page.js
    page.tsx (duplicate!)
    admin/
    tracker/
  ```
- **Required**:
  ```
  app/
    layout.js
    page.js
    (auth)/
      page.js
    (tracker)/
      page.js
    (admin)/
      page.js
  ```
- **Issue**: 
  - Duplicate `page.js` and `page.tsx`
  - Not using route groups for organization
  - Mixing `.tsx` and `.js` extensions
- **Severity**: CRITICAL

### 4. **Missing Theme System**
- **Current**: Only basic dark/light in globals.css
- **Required**: Light, Dark, Neon, and System themes with separate CSS files
- **Missing Files**:
  - `styles/light-theme.css`
  - `styles/dark-theme.css`
  - `styles/neon-theme.css`
  - `styles/system-theme.css`
  - Theme switcher component
- **Severity**: HIGH

---

## 🟡 MISSING COMPONENTS (8 files needed)

1. **components/TrackerBoard.js** - Main board layout
2. **components/Phase.js** - Phase container
3. **components/Day.js** - Day container within phase
4. **components/LessonItem.js** - Individual lesson with checkbox & notes
5. **components/Leaderboard.js** - Ranked leaderboard with progress
6. **components/AdminPanel.js** - Tabs for admin functions
7. **components/CoursePlanEditor.js** - CRUD for phases/days/lessons
8. **components/ApprovalQueue.js** - Pending learner approvals
9. **components/FeedbackViewer.js** - Read-only feedback list

**Severity**: HIGH - Core functionality incomplete

---

## 🟡 MISSING UTILITIES

1. **lib/utils.js** - Helper functions (formatting, validation, etc.)
2. **lib/api.js** - ❌ Incomplete:
   - Missing error handling
   - No axios in dependencies
   - Should handle auth tokens
   - No TypeScript types

**Severity**: HIGH

---

## 🟡 MISSING/INCOMPLETE FILE: `lib/auth.js`

**Issues**:
- ❌ Using NextAuth instead of Supabase
- ❌ No Supabase Auth initialization
- ❌ No OTP/magic link implementation
- ❌ Missing session refresh logic
- ❌ No server-side auth check utility

**Severity**: HIGH

---

## 🟡 PAGE IMPLEMENTATION ISSUES

### `/app/page.js` (Welcome Page)
**Problems**:
- ❌ Using `useSession` from NextAuth (should use Supabase)
- ❌ No feedback textarea
- ❌ Invalid redirect logic (`<p>Loading...</p>` instead of actual redirect)
- ❌ Missing error states
- ❌ No Header/Footer layout
- ❌ Wrong API endpoint paths (`/user` should check if learner is approved)

### `/app/tracker/page.js` (Tracker Board)
**Problems**:
- ❌ Not fetching `GET /api/plans/:roomCode`
- ❌ Not fetching `GET /api/leaderboard/:roomCode`
- ❌ Missing room code detection/passing
- ❌ Wrong import path: `../lib/api` (should be `../../lib/api`)
- ❌ Wrong import path: `../components/TrackerBoard` (should be `../../components/`)
- ❌ No redirect check for unauthenticated users
- ❌ No Header/Footer layout
- ❌ Component `TrackerBoard.js` doesn't exist

### `/app/admin/page.js` (Admin Panel)
**Problems**:
- ❌ Same import path errors as tracker
- ❌ Should redirect to `/` if not authenticated
- ❌ Should redirect to `/` if not admin
- ❌ No Header/Footer layout
- ❌ Component `AdminPanel.js` doesn't exist
- ❌ Wrong redirect logic (returns `<p>Loading...</p>` instead of redirect)

---

## 🟡 LAYOUT ISSUES

### `app/layout.tsx`
**Problems**:
- ❌ Metadata title: "Create Next App" (should be "ODU Learner Companion")
- ❌ Missing Header & Footer components
- ❌ Missing theme provider/switcher setup
- ❌ Missing Supabase provider setup
- ❌ Inconsistent file type: `.tsx` (others are `.js`)
- ❌ No error boundary

---

## 🟡 PACKAGE.json ISSUES

**Missing Dependencies**:
```json
{
  "missing": [
    "@supabase/supabase-js",
    "@supabase/auth-helpers-nextjs",
    "axios"
  ]
}
```

---

## 🟡 COMPONENT ISSUES

### `components/LoginForm.js`
**Problems**:
- ❌ No email/OTP validation
- ❌ Handlers never called (`onLogin`, `onRegister` not implemented)
- ❌ Should integrate with Supabase Auth
- ❌ No loading/error states during auth

### `components/RequestJoinForm.js`
- ✅ Structure OK, but needs validation

### `components/Header.js` & `components/Footer.js`
- ✅ Basic structure OK

### `components/LoadingSpinner.js`
- ✅ Basic structure OK

---

## 🔧 REQUIRED ACTIONS

### Phase 1: Setup & Structure (CRITICAL)
- [ ] Remove `/pages` directory entirely
- [ ] Remove duplicate `app/page.tsx`
- [ ] Restructure `/app` with route groups: `(auth)`, `(tracker)`, `(admin)`
- [ ] Add `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs` to dependencies
- [ ] Add `axios` to dependencies
- [ ] Create `styles/` directory with theme files

### Phase 2: Authentication (CRITICAL)
- [ ] Create proper `lib/auth.js` with Supabase integration
- [ ] Implement Supabase Auth session handling
- [ ] Add OTP/magic link support
- [ ] Create auth middleware/guard for routes

### Phase 3: Create Missing Components (HIGH)
- [ ] `components/TrackerBoard.js`
- [ ] `components/Phase.js`, `Day.js`, `LessonItem.js`
- [ ] `components/Leaderboard.js`
- [ ] `components/AdminPanel.js`, `CoursePlanEditor.js`, `ApprovalQueue.js`, `FeedbackViewer.js`

### Phase 4: Update Existing Components (HIGH)
- [ ] Fix `LoginForm.js` with Supabase integration
- [ ] Update `Header.js` with proper logout and user display

### Phase 5: Fix Page Implementations (HIGH)
- [ ] Rewrite `/app/(auth)/page.js` (welcome/login)
- [ ] Rewrite `/app/(tracker)/page.js` (tracker board)
- [ ] Rewrite `/app/(admin)/page.js` (admin panel)
- [ ] Fix all import paths
- [ ] Implement proper redirects with `useRouter()`

### Phase 6: Layout & Styling (HIGH)
- [ ] Update `app/layout.js` to use `.js` extension
- [ ] Add Header/Footer to layout
- [ ] Create theme system CSS files
- [ ] Implement theme switcher
- [ ] Update metadata

### Phase 7: Utilities (MEDIUM)
- [ ] Complete `lib/api.js` with error handling & types
- [ ] Create `lib/utils.js` with helper functions

---

## ✅ WHAT'S OK

- Basic component structure for small components (Loading, Footer, etc.)
- `RequestJoinForm.js` structure is reasonable
- Tailwind CSS integration setup

---

## 🎯 NEXT STEPS

Would you like me to:
1. **Fix all issues automatically** - I'll reorganize the entire structure
2. **Start with Phase 1** - Set up correct folder structure and dependencies
3. **Focus on specific phase** - Pick which phase to tackle first

What's your preference?
