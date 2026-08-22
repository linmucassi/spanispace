// Adds an existing Spanispace user to a company as staff, or -- if no
// account exists with that email -- creates a platform_invites row so the
// caller gets a shareable registration link instead. Runs server-side with
// the service-role client because looking up an arbitrary email in `users`
// isn't opened to client-side RLS (privacy: that would let any signed-in
// user enumerate every account on the platform by email). The caller's own
// permission to do this at all is still checked here (company_can_manage),
// mirroring what RLS would enforce on a direct client insert.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const VALID_ROLES = ['admin', 'manager', 'member', 'viewer'];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const companyId = typeof body?.companyId === 'string' ? body.companyId : '';
  const role = typeof body?.role === 'string' ? body.role : '';

  if (!email || !companyId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Caller must actually manage this company -- checked here since this
  // route uses the service-role client, which bypasses RLS entirely.
  const { data: callerMembership } = await admin
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!callerMembership || (callerMembership.role !== 'owner' && callerMembership.role !== 'admin')) {
    return NextResponse.json({ error: 'You do not have permission to manage this team.' }, { status: 403 });
  }

  const { data: existingUser } = await admin.from('users').select('id').eq('email', email).maybeSingle();

  if (existingUser) {
    const { error: memberError } = await admin.from('company_members').insert({
      company_id: companyId,
      user_id: existingUser.id,
      role,
      added_by: user.id,
    });
    if (memberError) {
      const alreadyMember = memberError.code === '23505';
      return NextResponse.json(
        { error: alreadyMember ? 'That account already belongs to a company.' : memberError.message },
        { status: alreadyMember ? 409 : 500 },
      );
    }
    return NextResponse.json({ ok: true, added: true }, { status: 200 });
  }

  // No account yet -- create an invite instead.
  const { data: invite, error: inviteError } = await admin
    .from('platform_invites')
    .insert({ email, invite_type: 'company_member', company_id: companyId, company_role: role, invited_by: user.id })
    .select('token')
    .single();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  return NextResponse.json(
    { ok: true, inviteLink: `${origin}/register?invite=${invite.token}` },
    { status: 200 },
  );
}
