-- Add company-created events & training.
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Companies asked for a way to run their own events and training/bootcamps,
-- not just post jobs. Previously `trainings` had no ownership concept at
-- all and `events.creator_id` existed but nothing ever wrote to it or let
-- anyone but admin insert. This adds company ownership + the same
-- pending/verified/rejected vetting flow jobs already use, so company
-- submissions go to an admin review queue instead of straight to the
-- public site.

ALTER TABLE trainings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS vetted_status TEXT DEFAULT 'verified' CHECK (vetted_status IN ('pending', 'verified', 'rejected'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vetted_status TEXT DEFAULT 'verified' CHECK (vetted_status IN ('pending', 'verified', 'rejected'));

-- Public listings only show vetted content now (existing rows default to
-- 'verified' above, so nothing currently live disappears).
DROP POLICY IF EXISTS "Public read active trainings" ON trainings;
CREATE POLICY "Public read active trainings" ON trainings FOR SELECT USING (status IN ('active', 'completed') AND vetted_status = 'verified');

DROP POLICY IF EXISTS "Public read published events" ON events;
CREATE POLICY "Public read published events" ON events FOR SELECT USING (status IN ('published', 'ongoing', 'completed') AND vetted_status = 'verified');

CREATE POLICY "Companies insert own trainings" ON trainings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies read own trainings" ON trainings FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies update own trainings" ON trainings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = trainings.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies insert own events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies read own events" ON events FOR SELECT USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Companies update own events" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM company_profiles cp WHERE cp.id = events.company_id AND cp.user_id = auth.uid())
);
