// Lets the (unauthenticated) register page show invite context before
// signup -- "you're joining Acme as a Manager" -- without opening
// platform_invites to anon SELECT under RLS. Only returns the minimum
// needed to render that context, never the full row.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: invite } = await admin
    .from('platform_invites')
    .select('invite_type, company_role, status, expires_at, email, company_profiles(company_name)')
    .eq('token', token)
    .maybeSingle();

  if (!invite || invite.status !== 'pending' || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const companyProfile = Array.isArray(invite.company_profiles) ? invite.company_profiles[0] : invite.company_profiles;

  return NextResponse.json(
    {
      valid: true,
      inviteType: invite.invite_type,
      companyRole: invite.company_role,
      companyName: companyProfile?.company_name ?? null,
      email: invite.email,
    },
    { status: 200 },
  );
}
