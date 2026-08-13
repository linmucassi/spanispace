'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';
import CvExtractedReview, {
  emptyCvAutofillResult,
  type CvAutofillResult,
} from '@/components/candidate/CvExtractedReview';
import { FileUp, Loader2 } from 'lucide-react';

// Can't export metadata from a client component; handled at layout level

type AuditResult = {
  score: number;
  headline: string;
  strengths: string[];
  improvements: { area: string; suggestion: string }[];
  quickWins: string[];
};

type Stage = 'idle' | 'uploading' | 'analyzing' | 'results';

export default function CVAuditPage() {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [extracted, setExtracted] = useState<CvAutofillResult>(emptyCvAutofillResult);
  const [skillsText, setSkillsText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSaveFeedback(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('The CV audit currently only reads PDF files. Please upload your CV as a PDF.');
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

    // Same upload path as components/candidate/CvAutofill.tsx and
    // DocumentLibrary.tsx -- the file lands in candidate_documents (doc_type
    // 'cv'), so it also shows up in the profile's document library and
    // counts toward profile completeness, not just this page's audit.
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

    setStage('analyzing');

    try {
      const res = await fetch('/api/cv-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docRow.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setStage('idle');
        return;
      }

      setAudit({
        score: data.score,
        headline: data.headline,
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        quickWins: Array.isArray(data.quickWins) ? data.quickWins : [],
      });

      const ex = data.extracted ?? {};
      const result: CvAutofillResult = {
        full_name: ex.full_name ?? '',
        phone: ex.phone ?? '',
        location: ex.location ?? '',
        linkedin_url: ex.linkedin_url ?? '',
        github_url: ex.github_url ?? '',
        skills: Array.isArray(ex.skills) ? ex.skills : [],
        professional_summary: ex.professional_summary ?? '',
        work_experience: Array.isArray(ex.work_experience) ? ex.work_experience : [],
      };
      setExtracted(result);
      setSkillsText(result.skills.join(', '));
      setStage('results');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setStage('idle');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Merges into whatever profile already exists rather than overwriting it --
  // same non-destructive merge app/candidate/profile/page.tsx's
  // handleCvExtracted uses, since this page has no already-loaded profile
  // state of its own to merge against, only what's fetched right here.
  async function handleSaveToProfile() {
    setSavingProfile(true);
    setSaveFeedback(null);

    const supabase = createClient();
    if (!supabase) {
      setSaveFeedback({ type: 'error', message: 'Service unavailable.' });
      setSavingProfile(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveFeedback({ type: 'error', message: 'You must be signed in.' });
      setSavingProfile(false);
      return;
    }

    const { data: existing } = await supabase
      .from('candidate_profiles')
      .select('full_name, phone, location, skills, linkedin_url, github_url, professional_summary')
      .eq('user_id', user.id)
      .maybeSingle();

    const skills = Array.from(new Set(skillsText.split(',').map((s) => s.trim()).filter(Boolean)));
    const mergedSkills = Array.from(new Set([...(existing?.skills ?? []), ...skills]));
    const linkedin = extracted.linkedin_url?.trim();
    const github = extracted.github_url?.trim();

    const { error: upsertError } = await supabase.from('candidate_profiles').upsert(
      {
        user_id: user.id,
        full_name: extracted.full_name?.trim() || existing?.full_name,
        phone: extracted.phone?.trim() || existing?.phone || null,
        location: extracted.location?.trim() || existing?.location || null,
        linkedin_url: linkedin ? normalizeUrl(linkedin) : existing?.linkedin_url || null,
        github_url: github ? normalizeUrl(github) : existing?.github_url || null,
        professional_summary: extracted.professional_summary?.trim() || existing?.professional_summary || null,
        skills: mergedSkills,
      },
      { onConflict: 'user_id' }
    );

    if (upsertError) {
      setSaveFeedback({ type: 'error', message: `Could not save: ${upsertError.message}` });
      setSavingProfile(false);
      return;
    }

    if (extracted.work_experience.length > 0) {
      const { error: workError } = await supabase.from('work_experiences').insert(
        extracted.work_experience.map((entry) => ({
          user_id: user.id,
          job_title: entry.job_title,
          employer: entry.employer || null,
          work_type: entry.work_type,
          location: entry.location || null,
          duration_text: entry.duration_text || null,
          duties: entry.duties || null,
          skills_gained: entry.skills_gained,
        }))
      );
      if (workError) {
        console.error('[cv-audit] could not save work experience:', workError.message);
      }
    }

    setSavingProfile(false);
    setSaveFeedback({
      type: 'success',
      message: 'Profile updated from your CV.',
    });
  }

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 5) return 'text-amber-500';
    return 'text-red-500';
  };

  const scoreLabel = (score: number) => {
    if (score >= 8) return 'Strong';
    if (score >= 5) return 'Developing';
    return 'Needs Work';
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">AI CV Audit</h1>
          <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
            New
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Upload your CV as a PDF. Our AI career coach will score it, highlight strengths,
          give you specific improvements tailored to the South African job market, and offer
          to fill in your profile from the same document.
        </p>
      </div>

      {/* Upload */}
      {stage !== 'results' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-800 mb-1">Upload your CV (PDF)</p>
          <p className="text-xs text-slate-500 mb-3">Max 10 MB.</p>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              disabled={stage === 'uploading' || stage === 'analyzing'}
              onChange={handleFile}
              className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white file:text-sm file:font-medium hover:file:bg-brand-700 file:cursor-pointer cursor-pointer disabled:opacity-50"
            />
          </div>

          {(stage === 'uploading' || stage === 'analyzing') && (
            <div className="flex items-center gap-2 text-sm text-slate-600 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              {stage === 'uploading' ? 'Uploading your CV…' : 'Analysing your CV…'}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {stage === 'results' && audit && (
        <div className="space-y-6">
          {/* Score card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className={`text-5xl font-black ${scoreColor(audit.score)}`}>
                {audit.score}
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                out of 10
              </div>
            </div>
            <div className="w-px self-stretch bg-slate-100" />
            <div>
              <span className={`text-sm font-semibold uppercase tracking-wide ${scoreColor(audit.score)}`}>
                {scoreLabel(audit.score)}
              </span>
              <p className="text-slate-700 mt-1">{audit.headline}</p>
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Strengths
            </h2>
            <ul className="space-y-2">
              {audit.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-amber-500">↑</span> Areas to Improve
            </h2>
            <ul className="space-y-4">
              {audit.improvements.map((item, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-slate-800">{item.area}</span>
                  <p className="text-slate-600 mt-0.5">{item.suggestion}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick wins */}
          <div className="bg-brand-50 rounded-xl border border-brand-100 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-brand-600">⚡</span> Quick Wins
            </h2>
            <ul className="space-y-2">
              {audit.quickWins.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Fill profile from the same upload */}
          <div className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-900">Update your profile with this CV</h2>
            </div>
            <p className="text-sm text-slate-500 -mt-2">
              We also pulled these details out of the same upload. Review and edit them, then
              save to add anything missing to your profile — nothing here overwrites a field
              you've already filled in unless you change it below.
            </p>

            <CvExtractedReview
              result={extracted}
              setResult={setExtracted}
              skillsText={skillsText}
              setSkillsText={setSkillsText}
            />

            {saveFeedback && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  saveFeedback.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {saveFeedback.message}{' '}
                {saveFeedback.type === 'success' && (
                  <Link href="/candidate/profile" className="font-medium underline">
                    View your profile
                  </Link>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveToProfile}
                disabled={savingProfile}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save to my profile'}
              </button>
            </div>
          </div>

          {/* Retry button */}
          <button
            onClick={() => {
              setStage('idle');
              setAudit(null);
              setExtracted(emptyCvAutofillResult);
              setSkillsText('');
              setSaveFeedback(null);
              setError('');
            }}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            ← Audit a different CV
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
        AI-generated feedback is for guidance only and does not guarantee employment outcomes.
        Your uploaded CV is stored in your document library like any other document you upload,
        and the audit itself is processed by Anthropic&apos;s API.
      </p>
    </div>
  );
}
