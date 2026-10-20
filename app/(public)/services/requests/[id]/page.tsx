import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import CancelRequestButton from './CancelRequestButton';

export const metadata: Metadata = {
  title: 'Service request | Spanispace',
  robots: { index: false, follow: false },
};

const THREAD_STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: 'Chatting', tone: 'bg-brand-50 text-brand-700' },
  booked: { label: 'Booked', tone: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', tone: 'bg-ink-100 text-ink-500' },
  closed: { label: 'Closed', tone: 'bg-ink-100 text-ink-500' },
};

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
}

export default async function ServiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: request } = await supabase
    .from('service_requests')
    .select('id, requester_user_id, description, province, city, suburb, preferred_start, preferred_end, timing_notes, status, created_at, category:service_categories(name, slug)')
    .eq('id', id)
    .maybeSingle();
  if (!request) notFound();

  // Providers can read a request they're on, but this comparison page is the
  // requester's. Send a provider straight to their own conversation.
  if (request.requester_user_id !== user.id) {
    const { data: ownThread } = await supabase
      .from('service_threads')
      .select('id')
      .eq('request_id', id)
      .limit(1)
      .maybeSingle();
    if (ownThread) redirect(`/services/requests/${id}/chat/${ownThread.id}`);
    notFound();
  }

  const category = Array.isArray(request.category) ? request.category[0] : request.category;

  const { data: threads } = await supabase
    .from('service_threads')
    .select('id, provider_id, status, last_message_at, requester_last_read_at')
    .eq('request_id', id)
    .order('last_message_at', { ascending: false });

  const providerIds = (threads ?? []).map((t) => t.provider_id);
  const threadIds = (threads ?? []).map((t) => t.id);
  const [{ data: cards }, { data: lastMessages }] = await Promise.all([
    providerIds.length
      ? supabase.from('service_provider_cards').select('id, display_name, headline, from_price_cents').in('id', providerIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string; headline: string | null; from_price_cents: number | null }[] }),
    threadIds.length
      ? supabase.from('service_messages').select('thread_id, body, kind, created_at').in('thread_id', threadIds).eq('kind', 'text').order('created_at', { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as { thread_id: string; body: string; kind: string; created_at: string }[] }),
  ]);
  const cardById = new Map((cards ?? []).map((c) => [c.id, c]));
  const lastByThread = new Map<string, string>();
  for (const m of lastMessages ?? []) if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m.body);

  const when = [fmtDate(request.preferred_start), fmtDate(request.preferred_end)].filter(Boolean).join(' to ');

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <Link href="/services/requests" className="text-sm text-brand-600 hover:underline">← My service requests</Link>

        <section className="rounded-2xl border border-ink-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-ink-900">{category?.name}</h1>
            <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-600 capitalize">{request.status}</span>
          </div>
          <p className="text-ink-700 mt-3 whitespace-pre-line">{request.description}</p>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div><dt className="text-xs text-ink-400">Where</dt><dd className="text-ink-700">{[request.suburb, request.city, request.province].filter(Boolean).join(', ')}</dd></div>
            <div><dt className="text-xs text-ink-400">When</dt><dd className="text-ink-700">{when || 'Flexible'}</dd></div>
            {request.timing_notes && <div><dt className="text-xs text-ink-400">Timing</dt><dd className="text-ink-700">{request.timing_notes}</dd></div>}
          </dl>
          {request.status === 'open' && (
            <div className="mt-4 flex flex-wrap gap-3">
              {category?.slug && (
                <Link href={`/services/${category.slug}`} className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-bold text-ink-800 hover:border-brand-500">
                  Ask another provider
                </Link>
              )}
              <CancelRequestButton requestId={request.id} />
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink-900 mb-3">Conversations ({(threads ?? []).length})</h2>
          <ul className="space-y-3">
            {(threads ?? []).map((t) => {
              const card = cardById.get(t.provider_id);
              const status = THREAD_STATUS[t.status] ?? THREAD_STATUS.open;
              const unread = t.last_message_at && (!t.requester_last_read_at || t.last_message_at > t.requester_last_read_at);
              return (
                <li key={t.id}>
                  <Link href={`/services/requests/${request.id}/chat/${t.id}`} className="block rounded-2xl border border-ink-100 p-4 hover:border-brand-500 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink-900">{card?.display_name ?? 'Provider'}</p>
                      <span className="flex items-center gap-2">
                        {unread && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="New messages" />}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.tone}`}>{status.label}</span>
                      </span>
                    </div>
                    {card?.headline && <p className="text-xs text-ink-500">{card.headline}</p>}
                    <p className="text-sm text-ink-600 mt-2 line-clamp-1">{lastByThread.get(t.id) ?? 'No messages yet.'}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
