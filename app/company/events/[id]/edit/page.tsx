'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const EVENT_TYPES = [
  'webinar',
  'workshop',
  'hackathon',
  'career_fair',
  'bootcamp_session',
  'networking',
  'other',
];
const FORMATS = ['online', 'hybrid', 'in_person'];

type EventForm = {
  title: string;
  description: string;
  event_type: string;
  format: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  capacity: string;
  skills_focus: string;
};

// Convert a stored timestamptz into the value <input type="datetime-local"> expects
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CompanyEditEvent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    event_type: 'workshop',
    format: 'online',
    location: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    capacity: '',
    skills_focus: '',
  });

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;

      const supabase = createClient();
      if (!supabase) {
        setError('Unable to connect to database.');
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: company } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setError('Company profile not found.');
        setLoading(false);
        return;
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('company_id', company.id)
        .single();

      if (eventError || !event) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setForm({
        title: event.title ?? '',
        description: event.description ?? '',
        event_type: event.event_type ?? 'workshop',
        format: event.format ?? 'online',
        location: event.location ?? '',
        start_date: toLocalInput(event.start_date),
        end_date: toLocalInput(event.end_date),
        registration_deadline: event.registration_deadline ?? '',
        capacity: event.capacity ? String(event.capacity) : '',
        skills_focus: (event.skills_focus ?? []).join(', '),
      });
      setLoading(false);
    }

    fetchEvent();
  }, [eventId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!form.start_date) {
      setError('Start date is required.');
      setSaving(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Unable to connect to database.');
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('events')
      .update({
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        format: form.format,
        location: form.location || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        registration_deadline: form.registration_deadline || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        skills_focus: form.skills_focus
          ? form.skills_focus.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      })
      .eq('id', eventId);

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/company/events'), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Event not found</h2>
          <p className="text-red-700 text-sm mb-4">
            This event does not exist or you do not have permission to edit it.
          </p>
          <Link
            href="/company/events"
            className="inline-flex bg-white border border-red-200 text-red-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
          >
            Back to My Events
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2">Event Updated</h2>
          <p className="text-green-700 text-sm">Changes saved. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Edit Event</h1>
          <p className="text-slate-500 text-sm mt-1">Update the details below.</p>
        </div>
        <Link href="/company/events" className="text-sm text-slate-500 hover:text-slate-700">
          &larr; Back to Events
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
            <select
              name="event_type"
              value={form.event_type}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
            <select
              name="format"
              value={form.format}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start *</label>
            <input
              name="start_date"
              type="datetime-local"
              value={form.start_date}
              onChange={handleChange}
              required
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
            <input
              name="end_date"
              type="datetime-local"
              value={form.end_date}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline</label>
            <input
              name="registration_deadline"
              type="date"
              value={form.registration_deadline}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
            <input
              name="capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Skills Focus (comma-separated)</label>
          <input
            name="skills_focus"
            value={form.skills_focus}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/company/events')}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
