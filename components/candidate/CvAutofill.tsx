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
import { WORK_TYPE_LABELS } from './WorkExperience';
import { FileUp, Loader2, X } from 'lucide-react';

export interface CvAutofillWorkEntry {
  job_title: string;
  employer: string | null;
  work_type: string;
  location: string | null;
  duration_text: string | null;
  duties: string | null;
  skills_gained: string[];
}

export interface CvAutofillResult {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  skills: string[];
  professional_summary: string | null;
  work_experience: CvAutofillWorkEntry[];
}

type Stage = 'idle' | 'uploading' | 'extracting' | 'review';

const emptyResult: CvAutofillResult = {
  full_name: '',
  phone: '',
  location: '',
  linkedin_url: '',
  github_url: '',
  skills: [],
  professional_summary: '',
  work_experience: [],
};

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

  function updateEntry(index: number, patch: Partial<CvAutofillWorkEntry>) {
    setResult((prev) => ({
      ...prev,
      work_experience: prev.work_experience.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry
      ),
    }));
  }

  function removeEntry(index: number) {
    setResult((prev) => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index),
    }));
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full name</label>
              <input
                value={result.full_name ?? ''}
                onChange={(e) => setResult((prev) => ({ ...prev, full_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input
                type="tel"
                value={result.phone ?? ''}
                onChange={(e) => setResult((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
              <input
                value={result.location ?? ''}
                onChange={(e) => setResult((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
              <input
                value={result.linkedin_url ?? ''}
                onChange={(e) => setResult((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">GitHub URL</label>
              <input
                value={result.github_url ?? ''}
                onChange={(e) => setResult((prev) => ({ ...prev, github_url: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Skills (comma separated)
              </label>
              <input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Professional summary
              </label>
              <textarea
                value={result.professional_summary ?? ''}
                onChange={(e) =>
                  setResult((prev) => ({ ...prev, professional_summary: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              />
            </div>
          </div>

          {result.work_experience.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-600">Work experience found</p>
              {result.work_experience.map((entry, i) => (
                <div key={i} className="border border-slate-200 bg-white rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                      <input
                        value={entry.job_title}
                        onChange={(e) => updateEntry(i, { job_title: e.target.value })}
                        placeholder="Job title"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      />
                      <input
                        value={entry.employer ?? ''}
                        onChange={(e) => updateEntry(i, { employer: e.target.value })}
                        placeholder="Employer"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      />
                      <select
                        value={entry.work_type}
                        onChange={(e) => updateEntry(i, { work_type: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      >
                        {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <input
                        value={entry.duration_text ?? ''}
                        onChange={(e) => updateEntry(i, { duration_text: e.target.value })}
                        placeholder="Duration"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      />
                      <textarea
                        value={entry.duties ?? ''}
                        onChange={(e) => updateEntry(i, { duties: e.target.value })}
                        placeholder="Duties"
                        rows={2}
                        className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Remove this entry"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
