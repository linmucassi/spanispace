// Conversation actions: mark read, decline (provider), close (either party).

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { loadThreadContext, postSystemMessage } from '@/lib/services/messaging';

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : '';

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

  const context = await loadThreadContext(admin, id, user.id);
  if (!context) return bad('Conversation not found.', 404);
  const { thread, role } = context;
  const now = new Date().toISOString();

  if (action === 'read') {
    await admin
      .from('service_threads')
      .update(role === 'requester' ? { requester_last_read_at: now } : { provider_last_read_at: now })
      .eq('id', thread.id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'decline' || action === 'close') {
    if (thread.status !== 'open') return bad('This conversation is already closed.', 409);
    if (action === 'decline' && role !== 'provider') return bad('Only the provider can decline a request.', 403);
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) || null : null;

    await admin
      .from('service_threads')
      .update({ status: action === 'decline' ? 'declined' : 'closed', closed_by: user.id, closed_reason: reason })
      .eq('id', thread.id);
    await postSystemMessage(
      admin,
      thread.id,
      action === 'decline'
        ? 'The provider is not available for this job and has declined the request.'
        : `This conversation was closed by the ${role === 'requester' ? 'customer' : 'provider'}.`,
    );
    return NextResponse.json({ ok: true });
  }

  return bad('Unknown action.');
}
