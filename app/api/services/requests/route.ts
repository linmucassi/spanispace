// Create a service request (the requester's need) and open a conversation
// with one provider -- or add another provider to an existing open request,
// so the requester can compare quotes side by side. Spec: docs/project-details.md §7.4.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { scanFields, explainContactScan } from '@/lib/services/contactGuard';
import { PROVINCES } from '@/lib/services/config';
import { MAX_THREADS_PER_REQUEST, isUuid, postSystemMessage, recordViolation } from '@/lib/services/messaging';

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function date(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return bad('Invalid request.');

  const supabase = await createServerSupabase();
  if (!supabase) return bad('Service unavailable.', 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad('Please sign in to request a quote.', 401);

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (userRow?.role === 'company') {
    return bad('Booking services as a company is coming soon. For now, please use a personal account.', 403);
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return bad('Service unavailable.', 503);
  }

  // ---- Provider must be live, and not the requester themselves.
  if (!isUuid(body.provider_id)) return bad('Unknown provider.');
  const today = new Date().toISOString().slice(0, 10);
  const { data: provider } = await admin
    .from('service_providers')
    .select('id, user_id, verification_status, listing_active, police_clearance_expires_at')
    .eq('id', body.provider_id)
    .maybeSingle();
  if (!provider || provider.verification_status !== 'verified' || !provider.listing_active || !provider.police_clearance_expires_at || provider.police_clearance_expires_at < today) {
    return bad('This provider is not taking requests right now.', 409);
  }
  if (provider.user_id === user.id) return bad('You can’t request a quote from yourself.');

  // ---- Category must be one this provider offers (and is approved for).
  const categorySlug = str(body.category_slug, 60);
  const { data: category } = await admin.from('service_categories').select('id, name').eq('slug', categorySlug ?? '').eq('active', true).maybeSingle();
  if (!category) return bad('Choose a service.');
  const { data: offered } = await admin
    .from('provider_services')
    .select('id, qualification_status')
    .eq('provider_id', provider.id)
    .eq('category_id', category.id)
    .maybeSingle();
  if (!offered || offered.qualification_status === 'pending' || offered.qualification_status === 'rejected') {
    return bad(`This provider doesn't offer ${category.name}.`);
  }

  const message = str(body.message, 2000);

  // ---- Reuse an existing open request, or create a new one.
  let requestId: string;
  if (body.request_id) {
    if (!isUuid(body.request_id)) return bad('Unknown request.');
    const { data: existing } = await admin
      .from('service_requests')
      .select('id, category_id, status')
      .eq('id', body.request_id)
      .eq('requester_user_id', user.id)
      .maybeSingle();
    if (!existing || existing.status !== 'open') return bad('That request is no longer open.');
    if (existing.category_id !== category.id) return bad('That request is for a different service.');
    requestId = existing.id;
  } else {
    const description = str(body.description, 2000);
    const province = str(body.province, 40);
    const city = str(body.city, 80);
    const suburb = str(body.suburb, 80);
    const timingNotes = str(body.timing_notes, 200);
    const preferredStart = date(body.preferred_start);
    const preferredEnd = date(body.preferred_end);
    if (!description || description.length < 10) return bad('Describe the job in a sentence or two (at least 10 characters).');
    if (province && !PROVINCES.includes(province)) return bad('Choose a valid province.');
    if (!city) return bad('Add the town or city where the job is.');
    if (preferredStart && preferredStart < today) return bad('The start date can’t be in the past.');
    if (preferredStart && preferredEnd && preferredEnd < preferredStart) return bad('The end date must be after the start date.');

    const hits = scanFields({ description, city, suburb, 'timing notes': timingNotes, message });
    if (hits.length > 0) {
      await recordViolation(admin, user.id, null, hits[0].reasons, [description, timingNotes, message].filter(Boolean).join('\n'));
      return NextResponse.json({ error: explainContactScan(hits[0].reasons), blocked: true }, { status: 422 });
    }

    const { data: created, error } = await admin
      .from('service_requests')
      .insert({
        requester_user_id: user.id,
        category_id: category.id,
        description,
        province,
        city,
        suburb,
        preferred_start: preferredStart,
        preferred_end: preferredEnd,
        timing_notes: timingNotes,
      })
      .select('id')
      .single();
    if (error || !created) return bad(error?.message ?? 'Could not create your request.', 500);
    requestId = created.id;
  }

  // ---- One conversation per provider per request.
  const { data: existingThread } = await admin
    .from('service_threads')
    .select('id')
    .eq('request_id', requestId)
    .eq('provider_id', provider.id)
    .maybeSingle();
  if (existingThread) return NextResponse.json({ requestId, threadId: existingThread.id, existing: true });

  const { count } = await admin.from('service_threads').select('id', { count: 'exact', head: true }).eq('request_id', requestId);
  if ((count ?? 0) >= MAX_THREADS_PER_REQUEST) {
    return bad(`You can contact up to ${MAX_THREADS_PER_REQUEST} providers per request.`, 409);
  }

  if (message && body.request_id) {
    // New request path scanned it above. The reuse path scans it here.
    const hits = scanFields({ message });
    if (hits.length > 0) {
      await recordViolation(admin, user.id, null, hits[0].reasons, message);
      return NextResponse.json({ error: explainContactScan(hits[0].reasons), blocked: true }, { status: 422 });
    }
  }

  const { data: thread, error: threadError } = await admin
    .from('service_threads')
    .insert({ request_id: requestId, provider_id: provider.id, requester_user_id: user.id })
    .select('id')
    .single();
  if (threadError || !thread) return bad(threadError?.message ?? 'Could not start the conversation.', 500);

  await postSystemMessage(
    admin,
    thread.id,
    'Request sent. Agree the job and price here. Contact details stay private until a booking is confirmed.',
  );
  if (message) {
    await admin.from('service_messages').insert({ thread_id: thread.id, sender_id: user.id, kind: 'text', body: message });
    await admin.from('service_threads').update({ last_message_at: new Date().toISOString(), requester_last_read_at: new Date().toISOString() }).eq('id', thread.id);
  }

  return NextResponse.json({ requestId, threadId: thread.id });
}
