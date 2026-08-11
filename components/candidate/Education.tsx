'use client';

// Education for the candidate profile, one-to-many like WorkExperience.tsx
// (same self-contained load/insert/delete shape, own onChanged callback).
// Backs candidate_education, added in supabase/add-candidate-education.sql,
// which replaces the old single matric_grad_year/university columns.

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, Trash2, Plus } from 'lucide-react';

export interface EducationEntry {
  id: string;
  institution: string;
  qualification: string | null;
  field_of_study: string | null;
  duration_text: string | null;
}

const emptyForm = {
  institution: '',
  qualification: '',
  field_of_study: '',
  duration_text: '',
};

export default function Education({
  onChanged,
}: {
  onChanged?: (entries: EducationEntry[]) => void;
}) {
  const [entries, setEntries] = useState<EducationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error: loadError } = await supabase
      .from('candidate_education')
      .select('id, institution, qualification, field_of_study, duration_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (loadError) {
      console.error('[education] load error:', loadError.message);
    } else {
      const list = (data as EducationEntry[]) ?? [];
      setEntries(list);
      onChanged?.(list);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.institution.trim()) {
      setError('Give the institution a name, e.g. your school or university.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    if (!supabase) { setSaving(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error: insertError } = await supabase.from('candidate_education').insert({
      user_id: user.id,
      institution: form.institution.trim(),
      qualification: form.qualification.trim() || null,
      field_of_study: form.field_of_study.trim() || null,
      duration_text: form.duration_text.trim() || null,
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

  async function handleDelete(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase
      .from('candidate_education')
      .delete()
      .eq('id', id);
    if (deleteError) {
      setError(`Could not delete: ${deleteError.message}`);
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading education...</p>;
  }

  return (
    <div className="space-y-4">
      {entries.length === 0 && !showForm && (
        <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-4 border border-slate-100">
          No education added yet. Matric, a diploma, a degree, a short course,
          it all counts. Add as many as you have.
        </div>
      )}

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="border border-slate-200 rounded-xl p-4 flex items-start gap-3"
        >
          <GraduationCap className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {entry.institution}
              {entry.qualification ? ` · ${entry.qualification}` : ''}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {[entry.field_of_study, entry.duration_text].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(entry.id)}
            className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
            aria-label={`Remove ${entry.institution}`}
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
                Institution *
              </label>
              <input
                name="institution"
                value={form.institution}
                onChange={handleChange}
                placeholder="e.g. University of Cape Town, or your school"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Qualification
              </label>
              <input
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g. Matric, National Diploma, BCom"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Field of study
              </label>
              <input
                name="field_of_study"
                value={form.field_of_study}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Duration
              </label>
              <input
                name="duration_text"
                value={form.duration_text}
                onChange={handleChange}
                placeholder="e.g. 2020 to 2023, or Graduated 2022"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
              {saving ? 'Saving...' : 'Add Education'}
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
          Add Education
        </button>
      )}

      {error && !showForm && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
