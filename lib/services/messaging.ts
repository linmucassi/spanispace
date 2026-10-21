// Server-only helpers for Spanispace Services requests and messaging (S3).
// Writes go through the service-role client because service_requests,
// service_threads and service_messages deliberately have no client write
// policies (supabase/add-service-requests-messaging.sql). Every caller MUST
// establish who the user is with the cookie client first. These helpers
// never trust an id from the request body on their own.

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scanText, scanWithHistory, type ContactReason } from '@/lib/services/contactGuard';

export type Admin = ReturnType<typeof getSupabaseAdmin>;

// How many of the sender's previous messages are scanned together with the
// new one, to catch a number split across messages ("082" ... "123" ... "4567").
const HISTORY_WINDOW = 4;
export { MAX_MESSAGES_PER_MINUTE, MAX_THREADS_PER_REQUEST, VIOLATION_FLAG_THRESHOLD } from './messaging-constants';

export type ThreadContext = {
  thread: {
    id: string;
    request_id: string;
    provider_id: string;
    requester_user_id: string;
    status: 'open' | 'declined' | 'closed' | 'booked';
    contact_unlocked: boolean;
  };
  providerUserId: string;
  providerStatus: string;
  providerListed: boolean;
  role: 'requester' | 'provider';
};

export async function loadThreadContext(admin: Admin, threadId: string, userId: string): Promise<ThreadContext | null> {
  if (!/^[0-9a-f-]{36}$/i.test(threadId)) return null;
  const { data: thread } = await admin
    .from('service_threads')
    .select('id, request_id, provider_id, requester_user_id, status, contact_unlocked, provider:service_providers(user_id, verification_status, listing_active)')
    .eq('id', threadId)
    .maybeSingle();
  if (!thread) return null;
  const provider = Array.isArray(thread.provider) ? thread.provider[0] : thread.provider;
  if (!provider) return null;

  let role: ThreadContext['role'] | null = null;
  if (thread.requester_user_id === userId) role = 'requester';
  else if (provider.user_id === userId) role = 'provider';
  if (!role) return null;

  return {
    thread: {
      id: thread.id,
      request_id: thread.request_id,
      provider_id: thread.provider_id,
      requester_user_id: thread.requester_user_id,
      status: thread.status,
      contact_unlocked: thread.contact_unlocked,
    },
    providerUserId: provider.user_id,
    providerStatus: provider.verification_status,
    providerListed: provider.listing_active,
    role,
  };
}

// Scans the new message on its own and joined with the sender's recent
// messages in the same thread. Returns the reasons if either is blocked.
export async function scanOutgoing(admin: Admin, threadId: string, senderId: string, body: string): Promise<ContactReason[]> {
  const single = scanText(body);
  if (single.blocked) return single.reasons;

  const { data: recent } = await admin
    .from('service_messages')
    .select('body')
    .eq('thread_id', threadId)
    .eq('sender_id', senderId)
    .eq('kind', 'text')
    .order('created_at', { ascending: false })
    .limit(HISTORY_WINDOW);
  return scanWithHistory((recent ?? []).map((m) => m.body).reverse(), body);
}

export async function recordViolation(admin: Admin, userId: string, threadId: string | null, reasons: ContactReason[], body: string) {
  await admin.from('contact_violations').insert({ user_id: userId, thread_id: threadId, reasons, body: body.slice(0, 2000) });
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('contact_violations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);
  return count ?? 0;
}

export async function postSystemMessage(admin: Admin, threadId: string, body: string) {
  await admin.from('service_messages').insert({ thread_id: threadId, sender_id: null, kind: 'system', body });
  await admin.from('service_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}
