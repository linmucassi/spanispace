'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DocumentLibrary from '@/components/candidate/DocumentLibrary';

interface ProfileData {
  full_name: string;
  phone: string;
  whatsapp: string;
  location: string;
  matric_grad_year: number | null;
  university: string;
  skills: string[];
  portfolio_url: string;
}

const emptyProfile: ProfileData = {
  full_name: '',
  phone: '',
  whatsapp: '',
  location: '',
  matric_grad_year: null,
  university: '',
  skills: [],
  portfolio_url: '',
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

  async function loadProfile() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    setEmail(user.email ?? '');
    setUserId(user.id);

    const { data, error } = await supabase
      .from('candidate_profiles')
      .select(
        'full_name, phone, whatsapp, location, matric_grad_year, university, skills, portfolio_url'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) console.error('[profile] load error:', error.message);

    if (data) {
      setProfile({
        full_name: data.full_name ?? '',
        phone: data.phone ?? '',
        whatsapp: data.whatsapp ?? '',
        location: data.location ?? '',
        matric_grad_year: data.matric_grad_year ?? null,
        university: data.university ?? '',
        skills: data.skills ?? [],
        portfolio_url: data.portfolio_url ?? '',
      });
    }

    setLoading(false);
  }

  useEffect(() => { loadProfile(); }, []);

  function handleChange(field: keyof ProfileData, value: string | number | null) {
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

    const { error } = await supabase
      .from('candidate_profiles')
      .upsert(
        {
          user_id: userId,
          full_name: profile.full_name,
          phone: profile.phone || null,
          whatsapp: profile.whatsapp || null,
          location: profile.location || null,
          matric_grad_year: profile.matric_grad_year,
          university: profile.university || null,
          skills: profile.skills,
          portfolio_url: profile.portfolio_url || null,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      setFeedback({
        type: 'error',
        message: `Save failed: ${error.message}`,
      });
      setSaving(false);
      return;
    }

    // Reload from DB to confirm what was actually persisted
    await loadProfile();
    setFeedback({ type: 'success', message: 'Profile saved successfully.' });
    setSaving(false);
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">
          Keep your profile up to date so employers can find you.
        </p>
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

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
        {/* Personal Information */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g. Johannesburg, Gauteng"
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">Education</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Matric Graduation Year
              </label>
              <input
                type="number"
                min={1990}
                max={2030}
                value={profile.matric_grad_year ?? ''}
                onChange={(e) =>
                  handleChange(
                    'matric_grad_year',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g. 2022"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                University / Institution
              </label>
              <input
                type="text"
                value={profile.university}
                onChange={(e) => handleChange('university', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g. University of Cape Town"
              />
            </div>
          </div>
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
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
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
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Portfolio / LinkedIn / GitHub URL
            </label>
            <input
              type="url"
              value={profile.portfolio_url}
              onChange={(e) => handleChange('portfolio_url', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="https://yourportfolio.com"
            />
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
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
