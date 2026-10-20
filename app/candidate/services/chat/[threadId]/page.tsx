import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import ServiceChat, { type ChatMessage } from '@/components/services/ServiceChat';

export const metadata: Metadata = {
  title: 'Conversation | Spanispace Services',
  robots: { index: false, follow: false },
};

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : null;
}

// One conversation between a customer and a provider, shared by both.
export default async function ServiceChatPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // RLS only returns these rows to the two parties (and admins).
  const [{ data: thread }, { data: messages }] = await Promise.all([
    supabase
      .from('service_threads')
      .select('id, request_id, provider_id, requester_user_id, status, contact_unlocked')
      .eq('id', threadId)
      .maybeSingle(),
    supabase
      .from('service_messages')
      .select('id, sender_id, kind, body, created_at')
      .eq('thread_id', threadId)
      .order('created_at'),
  ]);
  if (!thread) notFound();
  const { data: request } = await supabase
    .from('service_requests')
    .select('id, description, city, suburb, preferred_start, preferred_end, timing_notes, status, category:service_categories(name)')
    .eq('id', thread.request_id)
    .maybeSingle();
  if (!request) notFound();

  const role: 'requester' | 'provider' = thread.requester_user_id === user.id ? 'requester' : 'provider';
  const category = Array.isArray(request.category) ? request.category[0] : request.category;

  let otherName = role === 'requester' ? 'Provider' : 'Customer';
  if (role === 'requester') {
    const { data: card } = await supabase.from('service_provider_cards').select('display_name').eq('id', thread.provider_id).maybeSingle();
    if (card?.display_name) otherName = card.display_name;
  } else {
    const { data: name } = await supabase.rpc('service_thread_requester_name', { p_thread_id: thread.id });
    if (typeof name === 'string' && name) otherName = name;
  }

  const when = [fmtDate(request.preferred_start), fmtDate(request.preferred_end)].filter(Boolean).join(' to ');
  const back = role === 'requester'
    ? { href: `/candidate/services/hire/${request.id}`, label: '← All quotes for this job' }
    : { href: '/candidate/services/inbox', label: '← Service requests' };

  return (
    <div className="max-w-5xl mx-auto">
        <Link href={back.href} className="text-sm text-brand-600 hover:underline">{back.label}</Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2">
            <ServiceChat
              threadId={thread.id}
              currentUserId={user.id}
              role={role}
              otherName={otherName}
              initialMessages={(messages ?? []) as ChatMessage[]}
              initialStatus={thread.status}
              contactUnlocked={thread.contact_unlocked}
            />
          </div>
          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-400">The job</p>
              <p className="font-semibold text-ink-900 mt-1">{category?.name}</p>
              <p className="text-ink-700 mt-2 whitespace-pre-line">{request.description}</p>
              <dl className="mt-3 space-y-1.5 text-ink-600">
                <div><dt className="inline text-ink-400">Where: </dt><dd className="inline">{[request.suburb, request.city].filter(Boolean).join(', ')}</dd></div>
                <div><dt className="inline text-ink-400">When: </dt><dd className="inline">{when || 'Flexible'}</dd></div>
                {request.timing_notes && <div><dt className="inline text-ink-400">Timing: </dt><dd className="inline">{request.timing_notes}</dd></div>}
              </dl>
            </div>
            <div className="rounded-2xl border border-dashed border-ink-200 p-5 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">Agreeing and booking</p>
              <p className="mt-1">
                Soon you&apos;ll both be able to accept an offer here. Then {role === 'requester' ? 'you pay' : 'the customer pays'} the
                R10 booking fee, and phone numbers and the full address unlock. For now, use the chat to agree the details.
              </p>
            </div>
            <p className="text-xs text-ink-400">
              Spanispace is a marketplace. Providers are independent, and Spanispace doesn&apos;t guarantee the quality of a service.{' '}
              <Link href="/services/provider-agreement" className="underline">Learn more</Link>.
            </p>
          </aside>
        </div>
    </div>
  );
}
