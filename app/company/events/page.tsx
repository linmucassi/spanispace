import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EventActions from './EventActions';

function VettedBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-200 text-slate-600',
    cancelled: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

export default async function CompanyEvents() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: company } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) redirect('/company/profile');

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Events</h1>
          <p className="text-slate-500 text-sm">
            Host workshops, webinars, or career fairs for candidates
          </p>
        </div>
        <Link
          href="/company/events/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
        >
          + New Event
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {!events || events.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-1">No events yet</h3>
            <p className="text-sm text-slate-500 mb-6">
              Create a workshop, webinar, or career fair to engage candidates directly.
            </p>
            <Link
              href="/company/events/new"
              className="inline-flex bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Start</th>
                  <th className="px-6 py-3">Review</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {event.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {event.event_type || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {event.start_date
                        ? new Date(event.start_date).toLocaleDateString('en-ZA')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <VettedBadge status={event.vetted_status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-6 py-4">
                      <EventActions eventId={event.id} currentStatus={event.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
