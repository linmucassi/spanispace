import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

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

  const people = await Promise.all(
    (threads ?? []).map(async (t) => {
      const [{ data: name }, { data: avatar }] = await Promise.all([
        supabase.rpc('service_thread_requester_name', { p_thread_id: t.id }),
        supabase.rpc('service_thread_requester_avatar', { p_thread_id: t.id }),
      ]);
      return [t.id, { name: typeof name === 'string' ? name : 'Customer', avatar: typeof avatar === 'string' ? avatar : null }] as const;
    }),
  );
  const personByThread = new Map(people);

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
                    <span className="flex items-center gap-2 min-w-0">
                      <Avatar src={personByThread.get(t.id)?.avatar} name={personByThread.get(t.id)?.name ?? 'Customer'} size="sm" />
                      <p className="font-semibold text-slate-900 truncate">{personByThread.get(t.id)?.name} · {category?.name}</p>
                    </span>
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
