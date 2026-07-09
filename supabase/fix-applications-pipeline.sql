-- Fix: job applications never reach the database.
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Root cause: the public "apply for a job" form (ApplyForm.tsx) only ever
-- submitted to Netlify Forms (/__forms.html). Nothing wrote to the Supabase
-- applications table. Every page that reads `applications` --
-- /company/applications, /company/dashboard, /company/jobs (app counts),
-- /candidate/applications -- was reading a table real candidates never
-- populated. This migration adds the column the app-code fix needs;
-- the RLS insert policy ("Anyone can apply") already exists, no change
-- needed there.

ALTER TABLE applications ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
