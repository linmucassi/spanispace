'use client';

// Upload a CV, let Claude read it, then let the candidate review and edit
// what it found before handing it back to whichever page embedded this
// (app/candidate/onboarding/page.tsx or app/candidate/profile/page.tsx).
// Nothing here writes to candidate_profiles or work_experiences directly --
// onExtracted only fires once the candidate has confirmed the reviewed
// fields, and the parent page's own existing save flow persists them.
//
// PDF only: see app/api/cv-extract/route.ts for why. The upload itself still
// goes through candidate_documents/the documents bucket exactly like
// components/candidate/DocumentLibrary.tsx, so it also shows up there.

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import CvExtractedReview, {
  emptyCvAutofillResult,
  type CvAutofillResult,
  type CvAutofillWorkEntry,
} from './CvExtractedReview';
import { FileUp, Loader2 } from 'lucide-react';

export type { CvAutofillResult, CvAutofillWorkEntry };

type Stage = 'idle' | 'uploading' | 'extracting' | 'review';

const emptyResult = emptyCvAutofillResult;

export default function CvAutofill({
  onExtracted,
}: {
  onExtracted: (result: CvAutofillResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<CvAutofillResult>(emptyResult);
  const [skillsText, setSkillsText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('CV autofill currently only reads PDF files. Please upload your CV as a PDF.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Service unavailable.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be signed in.');
      return;
    }

    setStage('uploading');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setStage('idle');
      return;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);

    const { data: docRow, error: dbError } = await supabase
      .from('candidate_documents')
      .insert({
        user_id: user.id,
        name: file.name.replace(/\.[^.]+$/, ''),
        doc_type: 'cv',
        file_url: urlData.publicUrl,
        file_size_kb: Math.ceil(file.size / 1024),
      })
      .select('id')
      .single();

    if (dbError || !docRow) {
      setError(`Could not save upload: ${dbError?.message ?? 'unknown error'}`);
      setStage('idle');
      return;
    }

    setStage('extracting');

    try {
      const res = await fetch('/api/cv-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docRow.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not read your CV. Please try again.');
        setStage('idle');
        return;
      }

      const extracted: CvAutofillResult = {
        full_name: data.full_name ?? '',
        phone: data.phone ?? '',
        location: data.location ?? '',
        linkedin_url: data.linkedin_url ?? '',
        github_url: data.github_url ?? '',
        skills: Array.isArray(data.skills) ? data.skills : [],
        professional_summary: data.professional_summary ?? '',
        work_experience: Array.isArray(data.work_experience) ? data.work_experience : [],
      };
      setResult(extracted);
      setSkillsText(extracted.skills.join(', '));
      setStage('review');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setStage('idle');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleUseDetails() {
    const skills = Array.from(
      new Set(skillsText.split(',').map((s) => s.trim()).filter(Boolean))
    );
    onExtracted({ ...result, skills });
    setOpen(false);
    setStage('idle');
    setResult(emptyResult);
    setSkillsText('');
    setError('');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
      >
        <FileUp className="w-4 h-4" />
        Fill from my CV
      </button>
    );
  }

  return (
    <div className="border border-brand-200 bg-brand-50/40 rounded-xl p-4 space-y-4">
      {stage === 'idle' && (
        <div>
          <p className="text-sm font-medium text-slate-800 mb-1">Upload your CV (PDF)</p>
          <p className="text-xs text-slate-500 mb-3">
            We will read it and show you what we found, nothing saves until you confirm.
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={handleFile}
              className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white file:text-sm file:font-medium hover:file:bg-brand-700 file:cursor-pointer cursor-pointer"
            />
            <button
              type="button"
              onClick={() => { setOpen(false); setError(''); }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(stage === 'uploading' || stage === 'extracting') && (
        <div className="flex items-center gap-2 text-sm text-slate-600 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {stage === 'uploading' ? 'Uploading your CV…' : 'Reading your CV…'}
        </div>
      )}

      {stage === 'review' && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">
            Here is what we found. Edit anything before you use it.
          </p>

          <CvExtractedReview
            result={result}
            setResult={setResult}
            skillsText={skillsText}
            setSkillsText={setSkillsText}
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setOpen(false); setStage('idle'); setResult(emptyResult); setError(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleUseDetails}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Use these details
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
