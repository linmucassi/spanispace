-- add-training-levels.sql
-- Issue #6: beginner courses are free, advanced courses are paid.
--
-- Adds a `level` column to trainings and makes `is_free` a consequence of it
-- rather than a separate checkbox anyone can tick. The trigger runs on every
-- insert and update, so the rule holds for the admin panel, the company portal,
-- the seed file and anything written by hand in the SQL editor.
--
-- Idempotent. Safe to run more than once. Run it on the existing production
-- database, it does not need a fresh install.

-- 1. The column.
ALTER TABLE trainings
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Beginner';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trainings_level_check'
  ) THEN
    ALTER TABLE trainings
      ADD CONSTRAINT trainings_level_check CHECK (level IN ('Beginner', 'Advanced'));
  END IF;
END $$;

-- 2. Backfill. Rows written before this migration only carried is_free, so read
--    the level back out of it. Anything already marked paid was an advanced
--    course in practice.
UPDATE trainings
SET level = CASE WHEN is_free IS FALSE THEN 'Advanced' ELSE 'Beginner' END
WHERE level IS NULL OR level NOT IN ('Beginner', 'Advanced');

-- 3. The rule. is_free is derived from level, never set independently.
--    A generated column would reject every existing insert that passes is_free,
--    so this is a trigger that overwrites the value instead of failing.
CREATE OR REPLACE FUNCTION public.enforce_training_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_free := (NEW.level = 'Beginner');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trainings_enforce_pricing ON trainings;
CREATE TRIGGER trainings_enforce_pricing
  BEFORE INSERT OR UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_training_pricing();

-- 4. Bring existing rows in line with the rule now that it exists.
UPDATE trainings SET is_free = (level = 'Beginner') WHERE is_free IS DISTINCT FROM (level = 'Beginner');

-- 5. Candidates browse by level, so index it.
CREATE INDEX IF NOT EXISTS idx_trainings_level ON trainings(level);
