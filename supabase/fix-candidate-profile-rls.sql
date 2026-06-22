-- Fix: candidates could not create their own profile (no INSERT policy)
-- Run in Supabase Dashboard > SQL Editor

CREATE POLICY "Candidates insert own profile" ON candidate_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
