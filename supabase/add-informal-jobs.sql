-- ============================================================
-- Informal work as a first-class citizen (July 2026)
-- Run this in the Supabase SQL Editor BEFORE merging the
-- feature/sa-first-jobs-informal-work branch. Idempotent, safe to
-- re-run: the schema changes re-apply cleanly and the seed block runs
-- exactly once per database (tracked in seed_history), so deleted or
-- closed seed listings never come back.
--
-- What it does:
--   1. Adds 'Piece Job' and 'Temporary' to the jobs.job_type CHECK
--   2. Adds jobs.duration (e.g. '3 months', 'Weekends')
--   3. Adds candidate_profiles.professional_summary
--   4. Creates work_experiences — informal and piece job work history
--      that candidates turn into a professional profile
--   5. Indexes jobs.apply_link (the scraper's dedupe key)
--   6. Seeds curated everyday South African job listings with no
--      external apply link, so applications land in the applications
--      table and candidates actually get seen
-- ============================================================

-- 1. Widen jobs.job_type
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
  CHECK (job_type IN (
    'Remote', 'Hybrid', 'On-site', 'Learnership', 'Internship',
    'Contract', 'Full-time', 'Part-time', 'Once-off',
    'Piece Job', 'Temporary'
  ));

-- 2. How long the work lasts — informal work is often fixed-length
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration TEXT;

-- 3. The AI-written professional summary lives on the profile
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS professional_summary TEXT;

-- 4. Work experience — every job counts, including piece jobs and
--    informal work. References are how informal work is verified in SA,
--    so the table carries a reference name and phone per entry.
CREATE TABLE IF NOT EXISTS work_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  employer TEXT,
  work_type TEXT NOT NULL DEFAULT 'informal' CHECK (
    work_type IN ('formal', 'informal', 'piece_job', 'part_time', 'volunteer', 'self_employed')
  ),
  location TEXT,
  duration_text TEXT,
  duties TEXT,
  skills_gained TEXT[] DEFAULT '{}',
  reference_name TEXT,
  reference_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_experiences_user ON work_experiences(user_id);

ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates manage own work experiences" ON work_experiences;
CREATE POLICY "Candidates manage own work experiences" ON work_experiences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. The scraper dedupes on apply_link every run — keep that lookup fast
--    as the table grows.
CREATE INDEX IF NOT EXISTS idx_jobs_apply_link ON jobs(apply_link);

-- 6. Seed curated everyday jobs. These are starter listings owned by the
--    Spanispace Curated company (or unowned if it does not exist yet).
--    They have NO apply_link, so candidates apply inside Spanispace and
--    their applications are visible in the admin portal. Close or delete
--    them as real employers start posting — the seed_history marker
--    guarantees they are inserted exactly once per database, so a re-run
--    of this file never resurrects a listing an admin removed.
CREATE TABLE IF NOT EXISTS seed_history (
  key TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

WITH marker AS (
  INSERT INTO seed_history (key) VALUES ('informal-jobs-2026-07')
  ON CONFLICT (key) DO NOTHING
  RETURNING key
)
INSERT INTO jobs (
  company_id, title, description, requirements, location, job_type,
  duration, salary_range, apply_link, expiry_date, vetted_status,
  poster_name, status
)
SELECT
  (SELECT id FROM company_profiles WHERE company_name = 'Spanispace Curated' LIMIT 1),
  v.title, v.description, v.requirements, v.location, v.job_type,
  v.duration, v.salary_range, NULL,
  (CURRENT_DATE + INTERVAL '60 days')::date, 'verified',
  v.poster_name, 'active'
FROM (VALUES
  ('Waiter (3 Month Contract)',
   'Busy family restaurant needs a friendly waiter for the summer season. Take orders, serve tables, keep your section clean. Training provided on the till system.',
   'Friendly and reliable. Experience helps but is not required. Must be able to work evenings and weekends.',
   'Claremont, Cape Town', 'Temporary', '3 months', 'R25/hour plus tips',
   'Harbour View Restaurant'),
  ('Kitchen Assistant (Weekends)',
   'Help with food prep, washing up and keeping the kitchen clean at a busy kasi kitchen. Saturdays and Sundays.',
   'Hard working and clean. No experience needed, we will show you everything.',
   'Soweto, Johannesburg', 'Part-time', 'Weekends', 'R180/day',
   'Kasi Flavours Kitchen'),
  ('Cashier',
   'Work the till at a busy neighbourhood superette. Handle cash and card payments, help customers, assist with stock when quiet.',
   'Matric helps but is not required. Must be honest and good with people. Living nearby is a plus.',
   'Khayelitsha, Cape Town', 'Full-time', NULL, 'R4,500/month',
   'Sunrise Superette'),
  ('General Worker (Construction)',
   'Building site needs general workers for mixing, carrying and site clean up. Paid per day, work available most weeks.',
   'Physically fit. Show up on time every day. Safety boots provided.',
   'Tembisa, Gauteng', 'Piece Job', 'Per project', 'R250/day',
   'Mzansi Building Projects'),
  ('Domestic Worker (2 Days a Week)',
   'Family home needs help with cleaning, laundry and ironing on Tuesdays and Thursdays.',
   'Experience with housekeeping. Contactable reference required.',
   'Umhlanga, Durban', 'Part-time', 'Tuesdays and Thursdays', 'R350/day',
   'Private household'),
  ('Gardener (Weekends)',
   'Garden maintenance for a family home. Mowing, trimming, planting and general upkeep. Every Saturday.',
   'Knows basic garden work. Own transport helps but is not required.',
   'Randburg, Johannesburg', 'Piece Job', 'Weekends', 'R300/day',
   'Private household'),
  ('Security Guard (PSIRA Grade C)',
   'Retail site needs registered security guards for day and night shifts. Shift allowance for nights.',
   'Valid PSIRA Grade C or higher. Clear criminal record. Reliable transport to site.',
   'Durban Central, KwaZulu-Natal', 'Full-time', NULL, 'R6,000/month',
   'Shield Security Services'),
  ('Retail Assistant (Festive Season)',
   'Clothing store needs extra hands for the festive rush. Serve customers, manage fitting rooms, restock the floor.',
   'Friendly and presentable. Retail experience is a bonus, not a must.',
   'Midrand, Gauteng', 'Temporary', '2 months', 'R30/hour',
   'Fashion Corner'),
  ('Car Wash Attendant',
   'Wash and valet cars at a busy car wash. Paid daily plus tips. Start immediately.',
   'Hard working and careful with customer cars. No experience needed.',
   'Gugulethu, Cape Town', 'Piece Job', NULL, 'R150/day plus tips',
   'Sparkle Car Wash'),
  ('Delivery Driver (Motorbike)',
   'Deliver food orders around the CBD on our bikes. Flexible shifts, busiest evenings and weekends.',
   'Valid motorcycle licence. Knows the area well. Smartphone required.',
   'Pretoria CBD, Gauteng', 'Part-time', NULL, 'Up to R2,000/week',
   'QuickBite Deliveries'),
  ('Nanny / Childminder',
   'Look after two children (ages 3 and 6) on weekday afternoons. School pickup, homework help, light meals.',
   'Experience with children and a contactable reference. First aid knowledge is a plus.',
   'Milnerton, Cape Town', 'Part-time', 'Weekday afternoons', 'R5,500/month',
   'Private household'),
  ('Spaza Shop Assistant',
   'Help run a busy community spaza shop. Serve customers, manage stock, open or close some days.',
   'Trustworthy, good with numbers, lives in or near Alexandra.',
   'Alexandra, Johannesburg', 'Part-time', NULL, 'R2,800/month',
   'Community Spaza')
) AS v(title, description, requirements, location, job_type, duration, salary_range, poster_name)
WHERE EXISTS (SELECT 1 FROM marker);
