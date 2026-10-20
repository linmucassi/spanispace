// Send a message in a service conversation. This route is THE enforcement
// point for "no contact details before the booking is paid": clients have
// no INSERT policy on service_messages, so every message passes through the
// contact guard here (single message + the sender's recent history) until
// the thread's contact_unlocked flag is set by a confirmed payment (S4).

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { explainContactScan } from '@/lib/services/contactGuard';
import {
  MAX_MESSAGES_PER_MINUTE,
  VIOLATION_FLAG_THRESHOLD,
  isUuid,
  loadThreadContext,
  recordViolation,
  scanOutgoing,
} from '@/lib/services/messaging';

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.body === 'string' ? body.body.trim() : '';
  if (!isUuid(body?.thread_id)) return bad('Unknown conversation.');
  if (!text) return bad('Type a message first.');
  if (text.length > 2000) return bad('Messages can be up to 2,000 characters.');

  const supabase = await createServerSupabase();
  if (!supabase) return bad('Service unavailable.', 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad('Please sign in.', 401);

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return bad('Service unavailable.', 503);
  }

  const context = await loadThreadContext(admin, body.thread_id, user.id);
  if (!context) return bad('Conversation not found.', 404);
  const { thread, role } = context;

  if (thread.status === 'declined' || thread.status === 'closed') {
    return bad('This conversation is closed.', 409);
  }
  if (role === 'provider' && context.providerStatus !== 'verified') {
    return bad('Your provider account isn’t active, so you can’t reply right now.', 403);
  }

  const since = new Date(Date.now() - 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from('service_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .gte('created_at', since);
  if ((recentCount ?? 0) >= MAX_MESSAGES_PER_MINUTE) {
    return bad('You’re sending messages very quickly. Please wait a moment.', 429);
  }

  if (!thread.contact_unlocked) {
    const reasons = await scanOutgoing(admin, thread.id, user.id, text);
    if (reasons.length > 0) {
      const violations = await recordViolation(admin, user.id, thread.id, reasons, text);
      const warning = violations >= VIOLATION_FLAG_THRESHOLD
        ? ' Repeated attempts are reviewed by Spanispace and can lead to suspension.'
        : '';
      return NextResponse.json(
        { error: `${explainContactScan(reasons)}${warning}`, blocked: true },
        { status: 422 },
      );
    }
  }

  const now = new Date().toISOString();
  const { data: message, error } = await admin
    .from('service_messages')
    .insert({ thread_id: thread.id, sender_id: user.id, kind: 'text', body: text })
    .select('id, thread_id, sender_id, kind, body, created_at')
    .single();
  if (error || !message) return bad(error?.message ?? 'Could not send your message.', 500);

  await admin
    .from('service_threads')
    .update({
      last_message_at: now,
      ...(role === 'requester' ? { requester_last_read_at: now } : { provider_last_read_at: now }),
    })
    .eq('id', thread.id);

  return NextResponse.json({ message });
}
