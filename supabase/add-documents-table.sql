-- Add candidate_documents table
-- Run in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS candidate_documents (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  doc_type    TEXT        NOT NULL CHECK (doc_type IN ('cv', 'certificate', 'cover_letter', 'motivational_letter', 'other')),
  file_url    TEXT        NOT NULL,
  file_size_kb INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage own documents" ON candidate_documents
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Candidates can read their own documents
CREATE INDEX idx_candidate_docs_user ON candidate_documents(user_id);
