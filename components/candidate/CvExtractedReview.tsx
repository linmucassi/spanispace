'use client';

// The editable "here's what we found in your CV" form. Shared by
// CvAutofill.tsx (profile/onboarding "Fill from my CV") and
// app/candidate/cv-audit/page.tsx (upload-and-audit, which now also offers to
// fill the profile from the same upload) so the two flows show and edit
// extracted CV data identically instead of drifting apart.

import PhoneInput from '@/components/PhoneInput';
import { WORK_TYPE_LABELS } from './WorkExperience';
import { X } from 'lucide-react';

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

export const emptyCvAutofillResult: CvAutofillResult = {
  full_name: '',
  phone: '',
  location: '',
  linkedin_url: '',
  github_url: '',
  skills: [],
  professional_summary: '',
  work_experience: [],
};

export default function CvExtractedReview({
  result,
  setResult,
  skillsText,
  setSkillsText,
}: {
  result: CvAutofillResult;
  setResult: React.Dispatch<React.SetStateAction<CvAutofillResult>>;
  skillsText: string;
  setSkillsText: (text: string) => void;
}) {
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

  return (
    <div className="space-y-4">
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
          <PhoneInput
            value={result.phone ?? ''}
            onChange={(value) => setResult((prev) => ({ ...prev, phone: value }))}
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
    </div>
  );
}
