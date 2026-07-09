import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagesInbox, { type ThreadSummary } from '@/components/messaging/MessagesInbox';

export default async function CandidateMessages() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: candidate } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!candidate) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-16 text-center">
          <p className="text-slate-500">
            Complete your profile to receive messages from companies.
          </p>
        </div>
      </div>
    );
  }

  const { data: threadRows } = await supabase
    .from('message_threads')
    .select('id, last_message_at, company:company_profiles(company_name), job:jobs(title)')
    .eq('candidate_id', candidate.id)
    .order('last_message_at', { ascending: false });

  const threadIds = (threadRows ?? []).map((t) => t.id);

  const lastMessageByThread: Record<string, { body: string; created_at: string }> = {};
  const unreadByThread: Record<string, number> = {};

  if (threadIds.length > 0) {
    const [messagesRes, unreadRes] = await Promise.all([
      supabase
        .from('messages')
        .select('thread_id, body, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('thread_id')
        .in('thread_id', threadIds)
        .neq('sender_id', user.id)
        .is('read_at', null),
    ]);

    for (const row of messagesRes.data ?? []) {
      if (!lastMessageByThread[row.thread_id]) {
        lastMessageByThread[row.thread_id] = { body: row.body, created_at: row.created_at };
      }
    }
    for (const row of unreadRes.data ?? []) {
      unreadByThread[row.thread_id] = (unreadByThread[row.thread_id] || 0) + 1;
    }
  }

  const threads: ThreadSummary[] = (threadRows ?? []).map((t) => {
    const company = Array.isArray(t.company) ? t.company[0] : t.company;
    const job = Array.isArray(t.job) ? t.job[0] : t.job;
    return {
      id: t.id,
      otherPartyName: company?.company_name ?? 'Company',
      jobTitle: job?.title ?? null,
      lastMessageAt: t.last_message_at,
      lastMessageBody: lastMessageByThread[t.id]?.body ?? null,
      unreadCount: unreadByThread[t.id] || 0,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Messages</h1>
        <p className="text-slate-500 text-sm">Conversations with companies</p>
      </div>

      <MessagesInbox currentUserId={user.id} threads={threads} />
    </div>
  );
}
