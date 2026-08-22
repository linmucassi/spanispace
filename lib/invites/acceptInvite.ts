// Shared by app/api/invites/accept/route.ts (called right after
// supabase.auth.signUp() when a session exists immediately) and
// app/(auth)/callback/route.ts (the email-confirmation-link path, where no
// session exists until the confirmation link is clicked). Deliberately not
// wired into handle_new_user() -- see supabase/add-roles-invites-and-calendar.sql
// PART B for why.
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type AcceptInviteResult =
  | { ok: true; inviteType: 'platform_admin' | 'company_member' | 'referral' }
  | { ok: false; error: string; status: number };

export async function acceptPlatformInvite(
  userId: string,
  userEmail: string,
  token: string,
): Promise<AcceptInviteResult> {
  const admin = getSupabaseAdmin();

  const { data: invite, error: inviteError } = await admin
    .from('platform_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (inviteError || !invite) {
    return { ok: false, error: 'This invite link is invalid.', status: 404 };
  }

  if (invite.status !== 'pending') {
    return { ok: false, error: 'This invite has already been used or revoked.', status: 409 };
  }

  if (new Date(invite.expires_at) < new Date()) {
    await admin.from('platform_invites').update({ status: 'expired' }).eq('id', invite.id);
    return { ok: false, error: 'This invite has expired.', status: 409 };
  }

  if (invite.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
    return {
      ok: false,
      error: `This invite was sent to a different email address. Please sign up with ${invite.email}.`,
      status: 403,
    };
  }

  if (invite.invite_type === 'platform_admin') {
    const { error: promoteError } = await admin.from('users').update({ role: 'admin' }).eq('id', userId);
    if (promoteError) {
      console.error('[acceptPlatformInvite] could not promote to admin:', promoteError.message);
      return { ok: false, error: 'Could not grant admin access. Please try again.', status: 500 };
    }
  } else if (invite.invite_type === 'company_member') {
    const { error: memberError } = await admin.from('company_members').insert({
      company_id: invite.company_id,
      user_id: userId,
      role: invite.company_role,
      added_by: invite.invited_by,
    });
    if (memberError) {
      // UNIQUE(user_id) -- this account already belongs to a company (v1: one person, one company).
      const alreadyMember = memberError.code === '23505';
      console.error('[acceptPlatformInvite] could not add company member:', memberError.message);
      return {
        ok: false,
        error: alreadyMember
          ? 'This account already belongs to a company, so it cannot also join this one.'
          : 'Could not join the company. Please try again.',
        status: alreadyMember ? 409 : 500,
      };
    }
  }
  // 'referral' grants nothing -- just tracked as accepted below.

  await admin
    .from('platform_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  return { ok: true, inviteType: invite.invite_type };
}
