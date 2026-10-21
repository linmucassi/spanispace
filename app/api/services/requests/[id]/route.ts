// Requester actions on a whole request: cancel (closes every open conversation).

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isUuid, postSystemMessage } from '@/lib/services/messaging';

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!isUuid(id)) return bad('Unknown request.');
  if (body?.action !== 'cancel') return bad('Unknown action.');

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

  const { data: serviceRequest } = await admin
    .from('service_requests')
    .select('id, status')
    .eq('id', id)
    .eq('requester_user_id', user.id)
    .maybeSingle();
  if (!serviceRequest) return bad('Request not found.', 404);
  if (serviceRequest.status !== 'open') return bad('Only open requests can be cancelled.', 409);

  await admin.from('service_requests').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);

  const { data: openThreads } = await admin
    .from('service_threads')
    .select('id')
    .eq('request_id', id)
    .eq('status', 'open');
  for (const thread of openThreads ?? []) {
    await admin.from('service_threads').update({ status: 'closed', closed_by: user.id, closed_reason: 'request_cancelled' }).eq('id', thread.id);
    await postSystemMessage(admin, thread.id, 'The customer cancelled this request.');
  }

  return NextResponse.json({ ok: true });
}
