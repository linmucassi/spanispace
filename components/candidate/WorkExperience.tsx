'use client';

// Work experience for the candidate profile — built for the way South
// Africans actually work. A 3 month waitering contract, weekend gardening,
// helping at a spaza shop: every job counts here, and Spanispace turns it
// into a professional profile. Requires supabase/add-informal-jobs.sql.

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PhoneInput from '@/components/PhoneInput';
import { useConfirm } from '@/components/useConfirm';
import { Briefcase, Trash2, Plus } from 'lucide-react';

export interface WorkExperienceEntry {
  id: string;
  job_title: string;
  employer: string | null;
  work_type: string;
  location: string | null;
  duration_text: string | null;
  duties: string | null;
  skills_gained: string[];
  reference_name: string | null;
  reference_phone: string | null;
}

export const WORK_TYPE_LABELS: Record<string, string> = {
  piece_job: 'Piece job',
  informal: 'Informal work',
  part_time: 'Part time',
  self_employed: 'Self employed / hustle',
  volunteer: 'Volunteer',
  formal: 'Formal job',
};

const WORK_TYPE_COLORS: Record<string, string> = {
  piece_job: 'bg-amber-100 text-amber-700',
  informal: 'bg-emerald-100 text-emerald-700',
  part_time: 'bg-blue-100 text-blue-700',
  self_employed: 'bg-purple-100 text-purple-700',
  volunteer: 'bg-pink-100 text-pink-700',
  formal: 'bg-slate-100 text-slate-700',
};

const emptyForm = {
  job_title: '',
  employer: '',
  work_type: 'informal',
  location: '',
  duration_text: '',
  duties: '',
  skills_gained: '',
  reference_name: '',
  reference_phone: '',
};

export default function WorkExperience({
  onChanged,
}: {
  onChanged?: (entries: WorkExperienceEntry[]) => void;
}) {
  const [entries, setEntries] = useState<WorkExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const { confirm, ConfirmDialog } = useConfirm();

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error: loadError } = await supabase
      .from('work_experiences')
      .select('id, job_title, employer, work_type, location, duration_text, duties, skills_gained, reference_name, reference_phone')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (loadError) {
      console.error('[work-experience] load error:', loadError.message);
    } else {
      const list = (data as WorkExperienceEntry[]) ?? [];
      setEntries(list);
      onChanged?.(list);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.job_title.trim()) {
      setError('Give the work a name, e.g. Waiter, Gardener, Car wash.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    if (!supabase) { setSaving(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: insertError } = await supabase.from('work_experiences').insert({
      user_id: user.id,
      job_title: form.job_title.trim(),
      employer: form.employer.trim() || null,
      work_type: form.work_type,
      location: form.location.trim() || null,
      duration_text: form.duration_text.trim() || null,
      duties: form.duties.trim() || null,
      skills_gained: Array.from(
        new Set(form.skills_gained.split(',').map((s) => s.trim()).filter(Boolean))
      ),
      reference_name: form.reference_name.trim() || null,
      reference_phone: form.reference_phone.trim() || null,
    });

    setSaving(false);
    if (insertError) {
      setError(`Could not save: ${insertError.message}`);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: string, jobTitle: string) {
    if (!(await confirm(`Delete "${jobTitle}" from your work experience?`))) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase
      .from('work_experiences')
      .delete()
      .eq('id', id);
    if (deleteError) {
      setError(`Could not delete: ${deleteError.message}`);
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading work experience...</p>;
  }

  return (
    <div className="space-y-4">
      {entries.length === 0 && !showForm && (
        <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-4 border border-slate-100">
          No work added yet. Waitering for 3 months, weekend gardening, a car
          wash, helping at a spaza shop, it all counts. Add it and we turn it
          into a professional profile employers take seriously.
        </div>
      )}

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="border border-slate-200 rounded-xl p-4 flex items-start gap-3"
        >
          <Briefcase className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {entry.job_title}
                {entry.employer ? ` · ${entry.employer}` : ''}
              </p>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${WORK_TYPE_COLORS[entry.work_type] ?? 'bg-slate-100 text-slate-600'}`}
              >
                {WORK_TYPE_LABELS[entry.work_type] ?? entry.work_type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {[entry.location, entry.duration_text].filter(Boolean).join(' · ')}
            </p>
            {entry.duties && (
              <p className="text-sm text-slate-600 mt-1.5">{entry.duties}</p>
            )}
            {entry.skills_gained.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.skills_gained.map((skill, i) => (
                  <span
                    key={`${skill}-${i}`}
                    className="inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            {entry.reference_name && (
              <p className="text-xs text-slate-400 mt-2">
                Reference: {entry.reference_name}
                {entry.reference_phone ? ` (${entry.reference_phone})` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDelete(entry.id, entry.job_title)}
            className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
            aria-label={`Remove ${entry.job_title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleAdd} className="border border-brand-200 bg-brand-50/40 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                What was the work? *
              </label>
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                placeholder="e.g. Waiter, Gardener, Car wash"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Who did you work for?
              </label>
              <input
                name="employer"
                value={form.employer}
                onChange={handleChange}
                placeholder="e.g. Local restaurant, private family"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Type of work
              </label>
              <select
                name="work_type"
                value={form.work_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                How long?
              </label>
              <input
                name="duration_text"
                value={form.duration_text}
                onChange={handleChange}
                placeholder="e.g. 3 months, weekends in 2025"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Where?
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Khayelitsha, Cape Town"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                What did you do there?
              </label>
              <textarea
                name="duties"
                value={form.duties}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Served tables, handled cash, opened and closed the shop"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Skills you used or learned (comma separated)
              </label>
              <input
                name="skills_gained"
                value={form.skills_gained}
                onChange={handleChange}
                placeholder="e.g. Customer service, cash handling, teamwork"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reference name
              </label>
              <input
                name="reference_name"
                value={form.reference_name}
                onChange={handleChange}
                placeholder="Someone who can vouch for you"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reference phone
              </label>
              <PhoneInput
                value={form.reference_phone}
                onChange={(value) => setForm({ ...form, reference_phone: value })}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Work'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Work Experience
        </button>
      )}

      {error && !showForm && <p className="text-red-600 text-sm">{error}</p>}
      {ConfirmDialog}
    </div>
  );
}
