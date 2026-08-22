import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagesInbox, { type ThreadSummary } from '@/components/messaging/MessagesInbox';
import { resolveCompanyMembership } from '@/lib/company/resolveCompanyMembership';

type Props = {
  searchParams: Promise<{ candidateId?: string; jobId?: string }>;
};

export default async function CompanyMessages({ searchParams }: Props) {
  const { candidateId, jobId } = await searchParams;

  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const membership = await resolveCompanyMembership(supabase, user.id);
  if (!membership) redirect('/company/profile');
  const company = { id: membership.companyId };

  let selectedThreadId: string | null = null;

  if (candidateId) {
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('company_id', company.id)
      .eq('candidate_id', candidateId)
      .maybeSingle();

    if (existing) {
      selectedThreadId = existing.id;
    } else {
      const { data: created } = await supabase
        .from('message_threads')
        .insert({ company_id: company.id, candidate_id: candidateId, job_id: jobId ?? null })
        .select('id')
        .single();
      selectedThreadId = created?.id ?? null;
    }
  }

  const { data: threadRows } = await supabase
    .from('message_threads')
    .select('id, last_message_at, candidate:candidate_profiles(full_name), job:jobs(title)')
    .eq('company_id', company.id)
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
    const candidate = Array.isArray(t.candidate) ? t.candidate[0] : t.candidate;
    const job = Array.isArray(t.job) ? t.job[0] : t.job;
    return {
      id: t.id,
      otherPartyName: candidate?.full_name ?? 'Candidate',
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
        <p className="text-slate-500 text-sm">Conversations with candidates</p>
      </div>

      <MessagesInbox
        currentUserId={user.id}
        threads={threads}
        initialSelectedThreadId={selectedThreadId}
      />
    </div>
  );
}
