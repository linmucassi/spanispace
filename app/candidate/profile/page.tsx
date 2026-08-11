'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { normalizeUrl } from '@/lib/normalizeUrl';
import DocumentLibrary from '@/components/candidate/DocumentLibrary';
import WorkExperience, { type WorkExperienceEntry } from '@/components/candidate/WorkExperience';
import Education from '@/components/candidate/Education';
import AvatarUpload from '@/components/candidate/AvatarUpload';
import CvAutofill, { type CvAutofillResult } from '@/components/candidate/CvAutofill';
import { Sparkles } from 'lucide-react';

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
};

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [workEntries, setWorkEntries] = useState<WorkExperienceEntry[]>([]);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState('');
  const [workRefreshKey, setWorkRefreshKey] = useState(0);

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
      });
    }

    setLoading(false);
  }

  useEffect(() => { loadProfile(); }, []);

  function handleChange(field: keyof ProfileData, value: string | null) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setFeedback(null);
  }

  function addSkills() {
    if (!skillInput.trim()) return;
    const newSkills = skillInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !profile.skills.includes(s));
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, ...newSkills],
    }));
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkills();
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);

    const supabase = createClient();
    if (!supabase) {
      setFeedback({ type: 'error', message: 'Supabase is not configured.' });
      setSaving(false);
      return;
    }

    if (!userId) {
      setFeedback({ type: 'error', message: 'You must be signed in.' });
      setSaving(false);
      return;
    }

    const baseRow = {
      user_id: userId,
      full_name: profile.full_name,
      phone: profile.phone || null,
      whatsapp: profile.whatsapp || null,
      location: profile.location || null,
      skills: profile.skills,
      portfolio_url: profile.portfolio_url ? normalizeUrl(profile.portfolio_url) : null,
      linkedin_url: profile.linkedin_url ? normalizeUrl(profile.linkedin_url) : null,
      github_url: profile.github_url ? normalizeUrl(profile.github_url) : null,
    };

    let { error } = await supabase
      .from('candidate_profiles')
      .upsert(
        { ...baseRow, professional_summary: profile.professional_summary || null },
        { onConflict: 'user_id' }
      );

    // If the professional_summary column does not exist yet (migration not
    // run), save the rest of the profile instead of failing outright.
    let summaryDegraded = false;
    if (error && (error.code === 'PGRST204' || error.message?.includes('professional_summary'))) {
      summaryDegraded = true;
      ({ error } = await supabase
        .from('candidate_profiles')
        .upsert(baseRow, { onConflict: 'user_id' }));
    }

    if (error) {
      setFeedback({
        type: 'error',
        message: `Save failed: ${error.message}`,
      });
      setSaving(false);
      return;
    }

    // Reload from DB to confirm what was actually persisted. When the summary
    // could not be stored, keep the user's text on screen and say so honestly
    // instead of silently wiping it and claiming success.
    const summaryText = profile.professional_summary;
    await loadProfile();
    if (summaryDegraded) {
      setProfile((prev) => ({ ...prev, professional_summary: summaryText }));
      setFeedback({
        type: 'error',
        message:
          'Profile saved, but your professional summary could not be stored yet because the database update has not run. Your text is still below, copy it somewhere safe and save again once the update is live.',
      });
    } else {
      setFeedback({ type: 'success', message: 'Profile saved successfully.' });
    }
    setSaving(false);
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
      setFeedback({
        type: 'success',
        message: 'Professional profile built. Read it, make it yours, then press Save Profile.',
      });
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
  // simpler than teaching that self-contained component a new prop.
  async function handleCvExtracted(result: CvAutofillResult) {
    setProfile((prev) => ({
      ...prev,
      full_name: result.full_name?.trim() || prev.full_name,
      phone: result.phone?.trim() || prev.phone,
      location: result.location?.trim() || prev.location,
      professional_summary: result.professional_summary?.trim() || prev.professional_summary,
      linkedin_url: result.linkedin_url?.trim() || prev.linkedin_url,
      github_url: result.github_url?.trim() || prev.github_url,
      skills: Array.from(new Set([...prev.skills, ...result.skills])),
    }));

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

    setFeedback({
      type: 'success',
      message: 'Details filled in from your CV. Review them below, then press Save Profile.',
    });
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
            Keep your profile up to date so employers can find you.
          </p>
        </div>
        <Link
          href="/candidate/profile/preview"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
        >
          Preview my profile →
        </Link>
      </div>

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

      <CvAutofill onExtracted={handleCvExtracted} />

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
        {/* Personal Information */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">
            Personal Information
          </h2>

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
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. Thabo Mokoena"
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
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. 071 234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={profile.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="e.g. 071 234 5678"
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
        </div>

        {/* Education */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">Education</h2>
          <Education />
        </div>

        {/* Skills */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">Skills</h2>

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
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Online Presence</h2>
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
        </div>
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
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-base font-semibold text-slate-900">Your Professional Profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            One press turns your work history into a professional summary
            employers take seriously. Edit it until it sounds like you, then
            save. It is yours to use in applications and your CV.
          </p>
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-400">
              {workEntries.length === 0
                ? 'Add at least one work experience above to use the builder.'
                : `Built from your ${workEntries.length} work experience ${workEntries.length === 1 ? 'entry' : 'entries'}.`}
            </p>
            <button
              type="button"
              onClick={handleBuildSummary}
              disabled={building || workEntries.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {building ? 'Building your profile...' : 'Build My Professional Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Documents library — saved independently on upload, not part of the Save button */}
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

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !profile.full_name.trim()}
          className="px-6 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
