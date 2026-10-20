import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'My service requests | Spanispace',
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function MyServiceRequestsPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: requests } = await supabase
    .from('service_requests')
    .select('id, description, city, suburb, status, created_at, category:service_categories(name), threads:service_threads(id, status, last_message_at, requester_last_read_at)')
    .eq('requester_user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ink-900">My service requests</h1>
            <p className="text-ink-500 mt-1">Jobs you&apos;ve asked providers to quote on.</p>
          </div>
          <Link href="/services" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Find a provider</Link>
        </div>

        {(requests ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 px-6 py-12 text-center">
            <p className="font-semibold text-ink-900">No requests yet</p>
            <p className="text-sm text-ink-500 mt-1">Find a provider and tap &quot;Request a quote&quot; to start.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {(requests ?? []).map((r) => {
              const category = Array.isArray(r.category) ? r.category[0] : r.category;
              const threads = r.threads ?? [];
              const unread = threads.filter((t) => t.last_message_at && (!t.requester_last_read_at || t.last_message_at > t.requester_last_read_at)).length;
              return (
                <li key={r.id}>
                  <Link href={`/services/requests/${r.id}`} className="block rounded-2xl border border-ink-100 p-4 hover:border-brand-500 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink-900">{category?.name}</p>
                      <span className="flex items-center gap-2">
                        {unread > 0 && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{unread} new</span>}
                        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-bold text-ink-600">{STATUS_LABEL[r.status] ?? r.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-ink-600 mt-1 line-clamp-2">{r.description}</p>
                    <p className="text-xs text-ink-400 mt-2">
                      {[r.suburb, r.city].filter(Boolean).join(', ')} · {threads.length} provider{threads.length === 1 ? '' : 's'} contacted
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
