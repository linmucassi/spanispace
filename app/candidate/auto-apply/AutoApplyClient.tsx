'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DbAutomationPreferences } from '@/types/database';
import type { CandidateDocument } from '@/components/candidate/DocumentLibrary';
import { Sparkles, X, Check } from 'lucide-react';

export type MatchSummary = {
  matchId: string;
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  jobType: string;
  matchedAt: string;
};

type CandidateInfo = {
  full_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  email: string;
};

const WORK_TYPES = [
  'Remote',
  'Hybrid',
  'On-site',
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Learnership',
  'Once-off',
  'Piece Job',
  'Temporary',
];

function TagInput({
  label,
  placeholder,
  values,
  onChange,
  helperText,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  helperText?: string;
}) {
  const [input, setInput] = useState('');

  function addTags() {
    if (!input.trim()) return;
    const newTags = input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !values.includes(s));
    if (newTags.length > 0) onChange([...values, ...newTags]);
    setInput('');
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {helperText && <p className="text-xs text-slate-400 mb-1.5">{helperText}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTags();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
        <button
          type="button"
          onClick={addTags}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 text-brand-400 hover:text-brand-700 transition-colors"
                aria-label={`Remove ${v}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutoApplyClient({
  candidateId,
  candidateInfo,
  candidateSkills,
  documents,
  preferences,
  matches,
}: {
  candidateId: string;
  candidateInfo: CandidateInfo;
  candidateSkills: string[];
  documents: CandidateDocument[];
  preferences: DbAutomationPreferences | null;
  matches: MatchSummary[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!preferences);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [actingOnMatch, setActingOnMatch] = useState<string | null>(null);

  const [fields, setFields] = useState<string[]>(
    preferences?.fields_of_interest ?? candidateSkills
  );
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>(
    preferences?.excluded_companies ?? []
  );
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    preferences?.preferred_locations ?? []
  );
  const [workTypes, setWorkTypes] = useState<string[]>(preferences?.work_types ?? []);

  const enabled = preferences?.enabled ?? false;

  function toggleWorkType(type: string) {
    setWorkTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    const supabase = createClient();
    if (!supabase) {
      setFeedback({ type: 'error', message: 'Unable to connect to database.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('candidate_automation_preferences').upsert(
      {
        candidate_id: candidateId,
        enabled: true,
        fields_of_interest: fields,
        excluded_companies: excludedCompanies,
        work_types: workTypes,
        preferred_locations: preferredLocations,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'candidate_id' }
    );

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: `Save failed: ${error.message}` });
      return;
    }

    setFeedback({ type: 'success', message: 'Auto-apply is set up. We\'ll surface matches here as they come in.' });
    setEditing(false);
    router.refresh();
  }

  async function handleDisable() {
    setSaving(true);
    const supabase = createClient();
    if (!supabase) {
      setSaving(false);
      return;
    }

    await supabase
      .from('candidate_automation_preferences')
      .update({ enabled: false })
      .eq('candidate_id', candidateId);

    setSaving(false);
    router.refresh();
  }

  async function handleApply(match: MatchSummary) {
    setActingOnMatch(match.matchId);
    const supabase = createClient();
    if (!supabase) {
      setActingOnMatch(null);
      return;
    }

    // Same endpoint the public apply form uses, so an application made from
    // the match queue gets the confirmation email and the duplicate guard too.
    // A raw insert here would silently skip both.
    let status = 0;
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: match.jobId,
          fullName: candidateInfo.full_name,
          phone: candidateInfo.phone,
          whatsapp: candidateInfo.whatsapp,
          email: candidateInfo.email,
          location: candidateInfo.location,
          documentIds: documents.map((d) => d.id),
        }),
      });
      status = response.status;
    } catch {
      status = 0;
    }

    // 409 means the candidate already applied for this job through the public
    // form. The application stands, so the match still has to be marked
    // applied, otherwise it sits in the queue as pending forever.
    if (status === 201 || status === 409) {
      await supabase
        .from('application_matches')
        .update({ status: 'applied' })
        .eq('id', match.matchId);
    }

    setActingOnMatch(null);
    router.refresh();
  }

  async function handleDismiss(match: MatchSummary) {
    setActingOnMatch(match.matchId);
    const supabase = createClient();
    if (!supabase) {
      setActingOnMatch(null);
      return;
    }

    await supabase
      .from('application_matches')
      .update({ status: 'dismissed' })
      .eq('id', match.matchId);

    setActingOnMatch(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h2 className="text-base font-semibold text-slate-900">Auto-Apply Preferences</h2>
            {enabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                <Check className="w-3 h-3" /> Enabled
              </span>
            )}
          </div>
          {!editing && preferences && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-brand-600 font-medium hover:underline"
              >
                Edit
              </button>
              {enabled && (
                <button
                  onClick={handleDisable}
                  disabled={saving}
                  className="text-sm text-slate-500 font-medium hover:underline disabled:opacity-50"
                >
                  Turn off
                </button>
              )}
            </div>
          )}
        </div>

        {!editing && preferences ? (
          <div className="p-6 space-y-3 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Fields / Expertise
              </span>
              <p className="text-slate-700 mt-0.5">
                {fields.length > 0 ? fields.join(', ') : 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Work Types</span>
              <p className="text-slate-700 mt-0.5">
                {workTypes.length > 0 ? workTypes.join(', ') : 'Any'}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Preferred Locations
              </span>
              <p className="text-slate-700 mt-0.5">
                {preferredLocations.length > 0 ? preferredLocations.join(', ') : 'Any'}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Excluded Companies
              </span>
              <p className="text-slate-700 mt-0.5">
                {excludedCompanies.length > 0 ? excludedCompanies.join(', ') : 'None'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {!preferences && (
              <p className="text-sm text-slate-500">
                We&apos;ve pre-filled fields of interest from your profile skills. Edit anything below, then save to turn on auto-apply.
              </p>
            )}

            <TagInput
              label="Which area/field/expertise are you applying to?"
              placeholder="e.g. Data Analysis, Software Development"
              values={fields}
              onChange={setFields}
              helperText="We'll only match jobs whose title or description mentions one of these."
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Work type
              </label>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleWorkType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      workTypes.includes(type)
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Leave all unselected to match any work type.
              </p>
            </div>

            <TagInput
              label="Preferred locations"
              placeholder="e.g. Johannesburg, Remote"
              values={preferredLocations}
              onChange={setPreferredLocations}
              helperText="Optional. Leave empty to match any location."
            />

            <TagInput
              label="Which companies should we exclude?"
              placeholder="e.g. Your current employer"
              values={excludedCompanies}
              onChange={setExcludedCompanies}
              helperText="We'll never surface jobs from these companies."
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : preferences ? 'Save Changes' : 'Enable Auto-Apply'}
              </button>
              {preferences && (
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Match queue */}
      {enabled && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Matches for you {matches.length > 0 && `(${matches.length})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              New matches are found daily. Review each one, nothing is submitted until you click Apply.
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              No new matches yet. Check back soon.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{match.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {match.company}
                      {match.location ? ` · ${match.location}` : ''} · {match.jobType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDismiss(match)}
                      disabled={actingOnMatch === match.matchId}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApply(match)}
                      disabled={actingOnMatch === match.matchId}
                      className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {actingOnMatch === match.matchId ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
