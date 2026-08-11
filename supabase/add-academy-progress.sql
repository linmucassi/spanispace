-- add-academy-progress.sql
-- Training lesson content (data/academy.ts, data/courses.ts) was readable by
-- anyone, logged in or not, and there was nowhere to persist how far a reader
-- had gotten. This table gives a signed-in user a place to record which
-- lessons they have completed, per course, per lesson number.
--
-- Keyed on auth.uid() directly rather than candidate_profiles.id, because the
-- gate is "are you signed in", not "are you a candidate" -- a company or admin
-- account can read and complete lessons too.
--
-- Idempotent. Safe to run more than once.

CREATE TABLE IF NOT EXISTS academy_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  lesson_number INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_slug, lesson_number)
);

ALTER TABLE academy_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own academy progress" ON academy_lesson_progress;
CREATE POLICY "Users manage their own academy progress" ON academy_lesson_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_academy_progress_user_course ON academy_lesson_progress(user_id, course_slug);
