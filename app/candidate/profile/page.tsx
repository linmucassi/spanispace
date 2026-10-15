'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';
import { joinFullName, splitFullName } from '@/lib/name';
import PhoneInput from '@/components/PhoneInput';
import DocumentLibrary from '@/components/candidate/DocumentLibrary';
import WorkExperience, { type WorkExperienceEntry } from '@/components/candidate/WorkExperience';
import Education from '@/components/candidate/Education';
import AvatarUpload from '@/components/candidate/AvatarUpload';
import CvAutofill, { type CvAutofillResult } from '@/components/candidate/CvAutofill';
import { Sparkles, Check } from 'lucide-react';

interface ProfileData {
  full_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  skills: string[];
  portfolio_url: string;
  linkedin_url: string;
  github_url: string;
  avatar_url: string | null;
  professional_summary: string;
  open_to_offers: boolean;
}

const emptyProfile: ProfileData = {
  full_name: '',
  phone: '',
  whatsapp: '',
  location: '',
  skills: [],
  portfolio_url: '',
  linkedin_url: '',
  github_url: '',
  avatar_url: null,
  professional_summary: '',
  open_to_offers: false,
};

type SectionFeedback = { type: 'success' | 'error'; message: string } | null;

// Small "Saved ✓" pill shown briefly after a section saves, instead of a
// page-wide banner -- lets each section report its own result without
// stealing focus from whatever the candidate is doing in another section.
function SavedTick() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
      <Check className="w-3.5 h-3.5" /> Saved
    </span>
  );
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  // full_name stays one column in the DB (see lib/name.ts) -- these two are
  // UI-only, kept in sync with profile.full_name on every change.
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [workEntries, setWorkEntries] = useState<WorkExperienceEntry[]>([]);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState('');
  const [workRefreshKey, setWorkRefreshKey] = useState(0);

  // Every section below saves itself independently (candidate_profiles is
  // one row, but nobody should have to scroll to the bottom and re-save
  // the whole thing just because they changed one field near the top).
  // Education and Work Experience already worked this way before this
  // change (their own tables, their own components); this brings the rest
  // of the page in line with that instead of the old single bottom button.
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalFeedback, setPersonalFeedback] = useState<SectionFeedback>(null);
  const [talentSaving, setTalentSaving] = useState(false);
  const [talentSaved, setTalentSaved] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsSaved, setSkillsSaved] = useState(false);
  const [onlineSaving, setOnlineSaving] = useState(false);
  const [onlineFeedback, setOnlineFeedback] = useState<SectionFeedback>(null);
  const [summarySaving, setSummarySaving] = useState(false);
  const [summaryFeedback, setSummaryFeedback] = useState<SectionFeedback>(null);

  async function loadProfile() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    setEmail(user.email ?? '');
    setUserId(user.id);

    // select('*') keeps this page working whether or not the
    // add-informal-jobs.sql migration (professional_summary) has run yet
    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) console.error('[profile] load error:', error.message);

    if (data) {
      const { firstName: fn, lastName: ln } = splitFullName(data.full_name ?? '');
      setFirstName(fn);
      setLastName(ln);
      setProfile({
        full_name: data.full_name ?? '',
        phone: data.phone ?? '',
        whatsapp: data.whatsapp ?? '',
        location: data.location ?? '',
        skills: data.skills ?? [],
        portfolio_url: data.portfolio_url ?? '',
        linkedin_url: data.linkedin_url ?? '',
        github_url: data.github_url ?? '',
        avatar_url: data.avatar_url ?? null,
        professional_summary: data.professional_summary ?? '',
        open_to_offers: data.open_to_offers ?? false,
      });
    }

    setLoading(false);
  }

  useEffect(() => { loadProfile(); }, []);

  function handleChange(field: keyof ProfileData, value: string | null) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(part: 'first' | 'last', value: string) {
    const nextFirst = part === 'first' ? value : firstName;
    const nextLast = part === 'last' ? value : lastName;
    if (part === 'first') setFirstName(value);
    else setLastName(value);
    setProfile((prev) => ({ ...prev, full_name: joinFullName(nextFirst, nextLast) }));
  }

  // Every candidate already has a candidate_profiles row by the time they
  // reach this page (handle_new_user() creates one at signup), so a plain
  // scoped update is enough here -- no need for upsert's "create the row"
  // branch, which also sidesteps full_name's NOT NULL constraint tripping
  // up a save that only touches e.g. skills.
  async function updateProfileFields(fields: Record<string, unknown>): Promise<string | null> {
    if (!userId) return 'You must be signed in.';
    const supabase = createClient();
    if (!supabase) return 'Supabase is not configured.';
    const { error } = await supabase.from('candidate_profiles').update(fields).eq('user_id', userId);
    return error?.message ?? null;
  }

  async function savePersonalInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.full_name.trim()) {
      setPersonalFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }
    setPersonalSaving(true);
    setPersonalFeedback(null);
    const error = await updateProfileFields({
      full_name: profile.full_name,
      phone: profile.phone || null,
      whatsapp: profile.whatsapp || null,
      location: profile.location || null,
    });
    setPersonalSaving(false);
    setPersonalFeedback(error ? { type: 'error', message: error } : { type: 'success', message: 'Saved.' });
  }

  // Single checkbox, immediate meaning -- saves the moment it's toggled
  // rather than needing a separate button click.
  async function toggleOpenToOffers(checked: boolean) {
    setProfile((prev) => ({ ...prev, open_to_offers: checked }));
    setTalentSaving(true);
    setTalentSaved(false);
    const error = await updateProfileFields({ open_to_offers: checked });
    setTalentSaving(false);
    if (error) {
      // Revert on failure (e.g. migration not run yet) so the toggle
      // doesn't claim a state that was never actually persisted.
      setProfile((prev) => ({ ...prev, open_to_offers: !checked }));
    } else {
      setTalentSaved(true);
      setTimeout(() => setTalentSaved(false), 2000);
    }
  }

  async function persistSkills(nextSkills: string[]) {
    setSkillsSaving(true);
    setSkillsSaved(false);
    const error = await updateProfileFields({ skills: nextSkills });
    setSkillsSaving(false);
    if (!error) {
      setSkillsSaved(true);
      setTimeout(() => setSkillsSaved(false), 2000);
    }
  }

  function addSkills() {
    if (!skillInput.trim()) return;
    const newSkills = skillInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !profile.skills.includes(s));
    if (newSkills.length === 0) { setSkillInput(''); return; }
    const nextSkills = [...profile.skills, ...newSkills];
    setProfile((prev) => ({ ...prev, skills: nextSkills }));
    setSkillInput('');
    persistSkills(nextSkills);
  }

  function removeSkill(skill: string) {
    const nextSkills = profile.skills.filter((s) => s !== skill);
    setProfile((prev) => ({ ...prev, skills: nextSkills }));
    persistSkills(nextSkills);
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkills();
    }
  }

  async function saveOnlinePresence(e: React.FormEvent) {
    e.preventDefault();
    setOnlineSaving(true);
    setOnlineFeedback(null);
    const error = await updateProfileFields({
      portfolio_url: profile.portfolio_url ? normalizeUrl(profile.portfolio_url) : null,
      linkedin_url: profile.linkedin_url ? normalizeUrl(profile.linkedin_url) : null,
      github_url: profile.github_url ? normalizeUrl(profile.github_url) : null,
    });
    setOnlineSaving(false);
    setOnlineFeedback(error ? { type: 'error', message: error } : { type: 'success', message: 'Saved.' });
  }

  async function saveSummary(e: React.FormEvent) {
    e.preventDefault();
    setSummarySaving(true);
    setSummaryFeedback(null);
    const error = await updateProfileFields({ professional_summary: profile.professional_summary || null });
    setSummarySaving(false);
    setSummaryFeedback(
      error
        ? { type: 'error', message: error.includes('professional_summary') ? 'This isn’t available yet, please try again later.' : error }
        : { type: 'success', message: 'Saved.' }
    );
  }

  async function handleBuildSummary() {
    setBuilding(true);
    setBuildError('');
    try {
      const res = await fetch('/api/profile-summary', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.summary) {
        setBuildError(data?.error ?? 'Could not build your profile. Please try again.');
        return;
      }
      const skills = Array.isArray(data.keySkills) ? data.keySkills.join(', ') : '';
      const text = [data.headline, data.summary, skills ? `Key skills: ${skills}` : '']
        .filter((part) => typeof part === 'string' && part.trim() !== '')
        .join('\n\n')
        .trim();
      setProfile((prev) => ({ ...prev, professional_summary: text }));
      setSummaryFeedback({ type: 'success', message: 'Built. Read it, make it yours, then press Save.' });
    } catch {
      setBuildError('Could not build your profile. Please try again.');
    } finally {
      setBuilding(false);
    }
  }

  // From CvAutofill, already reviewed and confirmed by the candidate. Only
  // non-empty extracted fields are applied, so a CV that is silent on e.g.
  // location never wipes out a location already on file. Skills merge rather
  // than replace for the same reason. Work experience entries are inserted
  // directly (same shape WorkExperience.tsx itself inserts), then the
  // component is remounted via workRefreshKey so it reloads and shows them --
  // simpler than teaching that self-contained component a new prop. Since
  // every section now saves itself, this writes each affected section
  // straight to the DB rather than just updating local state and waiting for
  // a bottom Save click that no longer exists.
  async function handleCvExtracted(result: CvAutofillResult) {
    if (result.full_name?.trim()) {
      const { firstName: fn, lastName: ln } = splitFullName(result.full_name.trim());
      setFirstName(fn);
      setLastName(ln);
    }
    const nextSkills = Array.from(new Set([...profile.skills, ...result.skills]));
    const next: ProfileData = {
      ...profile,
      full_name: result.full_name?.trim() || profile.full_name,
      phone: result.phone?.trim() || profile.phone,
      location: result.location?.trim() || profile.location,
      professional_summary: result.professional_summary?.trim() || profile.professional_summary,
      linkedin_url: result.linkedin_url?.trim() || profile.linkedin_url,
      github_url: result.github_url?.trim() || profile.github_url,
      skills: nextSkills,
    };
    setProfile(next);

    await updateProfileFields({
      full_name: next.full_name,
      phone: next.phone || null,
      location: next.location || null,
      professional_summary: next.professional_summary || null,
      linkedin_url: next.linkedin_url ? normalizeUrl(next.linkedin_url) : null,
      github_url: next.github_url ? normalizeUrl(next.github_url) : null,
      skills: next.skills,
    });

    if (result.work_experience.length > 0 && userId) {
      const supabase = createClient();
      if (supabase) {
        const { error: insertError } = await supabase.from('work_experiences').insert(
          result.work_experience.map((entry) => ({
            user_id: userId,
            job_title: entry.job_title,
            employer: entry.employer || null,
            work_type: entry.work_type,
            location: entry.location || null,
            duration_text: entry.duration_text || null,
            duties: entry.duties || null,
            skills_gained: entry.skills_gained,
          }))
        );
        if (insertError) {
          console.error('[profile] could not save CV work experience:', insertError.message);
        } else {
          setWorkRefreshKey((k) => k + 1);
        }
      }
    }

    setPersonalFeedback({ type: 'success', message: 'Filled in from your CV and saved. Review below.' });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">
            Keep your profile up to date so employers can find you. Each section saves on its own.
          </p>
        </div>
        <Link
          href="/candidate/profile/preview"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
        >
          Preview my profile →
        </Link>
      </div>

      <CvAutofill onExtracted={handleCvExtracted} />

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
        {/* Personal Information */}
        <form onSubmit={savePersonalInfo} className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Personal Information
            </h2>
            {personalFeedback?.type === 'success' && <SavedTick />}
          </div>

          {userId && (
            <AvatarUpload
              userId={userId}
              avatarUrl={profile.avatar_url}
              fullName={profile.full_name}
              onUploaded={(url) => setProfile((prev) => ({ ...prev, avatar_url: url }))}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => handleNameChange('first', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. Thabo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => handleNameChange('last', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. Mokoena"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <PhoneInput
                value={profile.phone}
                onChange={(value) => handleChange('phone', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                WhatsApp
              </label>
              <PhoneInput
                value={profile.whatsapp}
                onChange={(value) => handleChange('whatsapp', value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. Johannesburg, Gauteng"
              />
            </div>
          </div>

          {personalFeedback?.type === 'error' && <p className="text-red-600 text-sm">{personalFeedback.message}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={personalSaving || !profile.full_name.trim()}
              className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {personalSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {/* Talent pool visibility -- saves instantly on toggle, no button */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Talent Pool Visibility</h2>
            {talentSaving ? (
              <span className="text-xs text-slate-400">Saving...</span>
            ) : talentSaved ? (
              <SavedTick />
            ) : null}
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.open_to_offers}
              onChange={(e) => toggleOpenToOffers(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-700">
              Be discoverable — let companies find and invite you to apply, even for jobs you haven't applied to yet.
              <span className="block text-xs text-slate-500 mt-0.5">
                Off by default. Companies you've never applied to can only see your profile while this is on.
              </span>
            </span>
          </label>
        </div>

        {/* Education */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">Education</h2>
          <Education />
        </div>

        {/* Skills -- saves on each add/remove, no separate button */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Skills</h2>
            {skillsSaving ? (
              <span className="text-xs text-slate-400">Saving...</span>
            ) : skillsSaved ? (
              <SavedTick />
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Add skills (comma separated)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. Python, Excel, Data Analysis"
              />
              <button
                type="button"
                onClick={addSkills}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-0.5 text-brand-400 hover:text-brand-700 transition-colors"
                    aria-label={`Remove ${skill}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Online Presence */}
        <form onSubmit={saveOnlinePresence} className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Online Presence</h2>
            {onlineFeedback?.type === 'success' && <SavedTick />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Portfolio URL
              </label>
              <input
                type="text"
                inputMode="url"
                value={profile.portfolio_url}
                onChange={(e) => handleChange('portfolio_url', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="text"
                inputMode="url"
                value={profile.linkedin_url}
                onChange={(e) => handleChange('linkedin_url', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://linkedin.com/in/you"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                GitHub URL
              </label>
              <input
                type="text"
                inputMode="url"
                value={profile.github_url}
                onChange={(e) => handleChange('github_url', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="https://github.com/you"
              />
            </div>
          </div>
          {onlineFeedback?.type === 'error' && <p className="text-red-600 text-sm">{onlineFeedback.message}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={onlineSaving}
              className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {onlineSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Work Experience — the raw material of the professional profile */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-base font-semibold text-slate-900">
            Work Experience, Every Job Counts
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Piece jobs, weekend work, informal work and hustles belong here.
            This is what Spanispace turns into your professional profile.
          </p>
        </div>
        <div className="px-6 pb-6 pt-4">
          <WorkExperience key={workRefreshKey} onChanged={setWorkEntries} />
        </div>
      </div>

      {/* Professional Profile — informal work, presented professionally */}
      <form onSubmit={saveSummary} className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Your Professional Profile</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              One press turns your work history into a professional summary
              employers take seriously. Edit it until it sounds like you, then
              save. It is yours to use in applications and your CV.
            </p>
          </div>
          {summaryFeedback?.type === 'success' && <SavedTick />}
        </div>
        <div className="px-6 pb-6 pt-4 space-y-3">
          <textarea
            value={profile.professional_summary}
            onChange={(e) => handleChange('professional_summary', e.target.value)}
            rows={7}
            placeholder="Add your work experience above, then press the button and we will write this for you. You can also write it yourself."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
          {buildError && <p className="text-red-600 text-sm">{buildError}</p>}
          {summaryFeedback?.type === 'error' && <p className="text-red-600 text-sm">{summaryFeedback.message}</p>}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-400">
              {workEntries.length === 0
                ? 'Add at least one work experience above to use the builder.'
                : `Built from your ${workEntries.length} work experience ${workEntries.length === 1 ? 'entry' : 'entries'}.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBuildSummary}
                disabled={building || workEntries.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                {building ? 'Building...' : 'Build for me'}
              </button>
              <button
                type="submit"
                disabled={summarySaving}
                className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {summarySaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Documents library — saved independently on upload */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-base font-semibold text-slate-900">My Documents</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload your CV, certificates, motivational letters, and more. These are reusable when you apply for jobs.
          </p>
        </div>
        <div className="px-6 pb-6 pt-4">
          <DocumentLibrary />
        </div>
      </div>
    </div>
  );
}
