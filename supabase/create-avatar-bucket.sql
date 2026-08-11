-- Create the 'avatars' storage bucket and its RLS policies
-- Run in Supabase Dashboard › Storage or SQL Editor
--
-- Mirrors create-documents-bucket.sql's conventions exactly (public bucket,
-- {user_id}/... path prefix, same three storage.objects policies), sized
-- for images instead of CVs/certificates: 2 MB cap, image mime types only.
-- Insert-only, like documents -- a replaced avatar's old file just goes
-- unreferenced rather than needing an UPDATE policy, the same tradeoff
-- documents already accepts.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,   -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Only the owning candidate can upload into their own folder
CREATE POLICY "Candidates can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Candidates can read their own avatar folder; public URLs also work (bucket is public)
CREATE POLICY "Candidates can read own avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Candidates can delete their own avatar files
CREATE POLICY "Candidates can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
