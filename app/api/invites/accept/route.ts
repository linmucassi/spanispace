// Accepts a platform_invites token AFTER a normal signup already completed
// (supabase.auth.signUp() on the client, then this call, used when a
// session exists immediately -- Supabase email confirmation disabled). If
// confirmation is required instead, app/(auth)/callback/route.ts handles
// acceptance on that path via the same shared helper. See
// lib/invites/acceptInvite.ts and supabase/add-roles-invites-and-calendar.sql
// PART B for the full trust-model rationale.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { acceptPlatformInvite } from '@/lib/invites/acceptInvite';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing invite token.' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'You must be signed in to accept an invite.' }, { status: 401 });
  }

  const result = await acceptPlatformInvite(user.id, user.email, token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, inviteType: result.inviteType }, { status: 200 });
}
