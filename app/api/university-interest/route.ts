// University application interest, captured before the candidate is sent to
// the institution's own portal. Colleges/Universities is a fully separate
// system from jobs/learnerships/applications by design (see
// supabase/add-application-journeys.sql) -- this is its own small route,
// modeled on app/api/applications/route.ts's conventions (rate limiting,
// control-character stripping) rather than sharing that endpoint.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_KEYS = 5000;
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (recentSubmissions.size > RATE_LIMIT_MAX_KEYS) {
    for (const [k, times] of recentSubmissions) {
      if (times.every((at) => now - at >= RATE_LIMIT_WINDOW_MS)) recentSubmissions.delete(k);
    }
    if (recentSubmissions.size > RATE_LIMIT_MAX_KEYS) recentSubmissions.clear();
  }
  const hits = (recentSubmissions.get(key) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(key, hits);
    return true;
  }
  hits.push(now);
  recentSubmissions.set(key, hits);
  return false;
}

// Control characters stripped, not just trimmed -- same reasoning as
// app/api/applications/route.ts's identical helper.
const CONTROL_CHARS = new RegExp('[\\x00-\\x1f\\x7f]', 'g');

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(CONTROL_CHARS, ' ').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.lateUniAppId !== 'string') {
    return NextResponse.json({ error: 'Missing lateUniAppId.' }, { status: 400 });
  }

  const lateUniAppId = body.lateUniAppId.trim();
  const fullName = text(body.fullName, 200);
  if (!fullName) {
    return NextResponse.json({ error: 'Your full name is required.' }, { status: 400 });
  }

  const phone = text(body.phone, 40);
  const email = text(body.email, 320);
  if (email && !email.includes('@')) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }

  const clientKey =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  if (isRateLimited(clientKey)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let candidateId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    candidateId = profile?.id ?? null;
  }

  const { error: insertError } = await supabase.from('university_application_interests').insert({
    late_uni_app_id: lateUniAppId,
    candidate_id: candidateId,
    full_name: fullName,
    phone,
    email,
  });

  if (insertError) {
    console.error('[university-interest] insert failed:', insertError.code, insertError.message);
    return NextResponse.json({ error: 'We could not save your details. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
