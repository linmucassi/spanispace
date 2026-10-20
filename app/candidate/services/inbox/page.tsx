import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// The provider side of Spanispace Services conversations. Requests arrive
// here, one row per conversation, newest activity first.
export default async function ProviderInboxPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: provider } = await supabase.from('service_providers').select('id').eq('user_id', user.id).maybeSingle();
  if (!provider) redirect('/candidate/services');

  const { data: threads } = await supabase
    .from('service_threads')
    .select('id, request_id, status, last_message_at, provider_last_read_at, request:service_requests(description, city, suburb, preferred_start, category:service_categories(name))')
    .eq('provider_id', provider.id)
    .order('last_message_at', { ascending: false })
    .limit(50);

  const names = await Promise.all(
    (threads ?? []).map(async (t) => {
      const { data } = await supabase.rpc('service_thread_requester_name', { p_thread_id: t.id });
      return [t.id, typeof data === 'string' ? data : 'Customer'] as const;
    }),
  );
  const nameByThread = new Map(names);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/candidate/services" className="text-sm text-brand-600 hover:underline">← My Services</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-2">Service requests</h1>
      <p className="text-slate-500 text-sm mb-6">Customers asking you for a quote. Reply in the chat to agree the job and price.</p>

      {(threads ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No requests yet. Make sure your listing is switched on so customers can find you.
        </div>
      ) : (
        <ul className="space-y-3">
          {(threads ?? []).map((t) => {
            const request = Array.isArray(t.request) ? t.request[0] : t.request;
            const category = request ? (Array.isArray(request.category) ? request.category[0] : request.category) : null;
            const unread = t.last_message_at && (!t.provider_last_read_at || t.last_message_at > t.provider_last_read_at);
            return (
              <li key={t.id}>
                <Link href={`/candidate/services/chat/${t.id}`} className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand-500 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{nameByThread.get(t.id)} · {category?.name}</p>
                    <span className="flex items-center gap-2">
                      {unread && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">New</span>}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 capitalize">{t.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{request?.description}</p>
                  <p className="text-xs text-slate-400 mt-1">{[request?.suburb, request?.city].filter(Boolean).join(', ')}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
