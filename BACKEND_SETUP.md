# Backend Setup Guide for ODU Learner Companion

## Database Schema & RLS Policies

Run these SQL scripts in your Supabase SQL editor:

### 1. Create Tables (if not existing)

```sql
-- Course plans
CREATE TABLE IF NOT EXISTS course_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- Phases
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES course_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Days
CREATE TABLE IF NOT EXISTS days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  day_label TEXT NOT NULL,
  title TEXT NOT NULL,
  hours INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Lesson Items
CREATE TABLE IF NOT EXISTS lesson_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  tag TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Learners (approved)
CREATE TABLE IF NOT EXISTS learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  room_code TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, room_code)
);

-- Pending Learners
CREATE TABLE IF NOT EXISTS pending_learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  room_code TEXT NOT NULL,
  learner_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT now(),
  decided_at TIMESTAMP,
  UNIQUE(user_id, room_code)
);

-- Progress tracking
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES lesson_items(id) ON DELETE CASCADE,
  done BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES lesson_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  note_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Push tokens (optional, for future notifications)
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, token)
);
```

### 2. Create Indexes

```sql
CREATE INDEX idx_course_plans_room_code ON course_plans(room_code);
CREATE INDEX idx_phases_plan_id ON phases(plan_id);
CREATE INDEX idx_days_phase_id ON days(phase_id);
CREATE INDEX idx_lesson_items_day_id ON lesson_items(day_id);
CREATE INDEX idx_learners_user_id ON learners(user_id);
CREATE INDEX idx_learners_room_code ON learners(room_code);
CREATE INDEX idx_pending_learners_user_id ON pending_learners(user_id);
CREATE INDEX idx_pending_learners_room_code ON pending_learners(room_code);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_item_id ON progress(item_id);
CREATE INDEX idx_notes_item_id ON notes(item_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
```

### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE course_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Course Plans: Only admins can modify, everyone can read active plans
CREATE POLICY "course_plans_read_active" ON course_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "course_plans_admin_all" ON course_plans
  FOR ALL USING (auth.uid() = created_by);

-- Learners: Users can see their own learner record
CREATE POLICY "learners_user_read" ON learners
  FOR SELECT USING (auth.uid() = user_id);

-- Pending Learners: Users can see their own pending request
CREATE POLICY "pending_learners_user_read" ON pending_learners
  FOR SELECT USING (auth.uid() = user_id);

-- Progress: Users can see/edit only their own
CREATE POLICY "progress_user_all" ON progress
  FOR ALL USING (auth.uid() = user_id);

-- Notes: Users can see notes on items they have access to
CREATE POLICY "notes_user_all" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Feedback: Users can insert their own
CREATE POLICY "feedback_user_insert" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push tokens: Users manage their own
CREATE POLICY "push_tokens_user_all" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Environment Variables

Add to your backend `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin User IDs (comma-separated)
ADMIN_USER_IDS=user-id-1,user-id-2,user-id-3
```

## Environment Setup Steps

1. **Supabase Project:**
   - Go to https://supabase.com and create a project
   - Get your project URL and API keys

2. **Run SQL Scripts:**
   - Copy the SQL above into Supabase SQL Editor
   - Execute to create tables, indexes, and RLS policies

3. **Set Environment Variables:**
   - Get the service role key from Supabase Settings → API
   - Update .env.local with credentials and admin IDs

4. **Test Connection:**
   - Run `npm run dev` and test API endpoints

## Notes on Architecture

- **RLS Policies:** Handle authorization at database level
- **Service Role Key:** Used server-side only for admin operations
- **Anon Key:** Used for client operations with RLS protection
- **Admin Check:** Verify user ID against ADMIN_USER_IDS env variable
