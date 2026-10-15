// Welcome email for Google signups.
//
// signInWithIdToken (lib/auth/useGoogleSignIn.ts) hands Supabase a Google ID
// token carrying an email_verified claim, so GoTrue creates the account
// already confirmed and never sends a confirmation email -- correct, there is
// nothing left to verify, but it leaves a Google signup completely silent
// while the password path at least gets Supabase's confirmation mail. This
// route is the acknowledgement those users get instead.
//
// Called on every Google sign-in, not just signups, because the client can't
// tell the two apart. Two guards keep it to genuinely new accounts:
//
//   1. created_at must be inside NEW_ACCOUNT_WINDOW_MS. Without this, every
//      Google user who signed up before this route existed would be welcomed
//      on their next sign-in.
//   2. app_metadata.welcome_email_sent_at must be unset. app_metadata rather
//      than user_metadata because the latter is writable by the user's own
//      access token -- they could clear the flag and re-trigger the send.

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail, welcomeEmail } from '@/lib/email';

const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

export async function POST() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ sent: false, reason: 'not_configured' }, { status: 503 });
  }

  // getUser(), not getSession() -- this revalidates the token with Supabase
  // rather than trusting a cookie, and the identity here decides who receives
  // mail. The caller sends no body at all for the same reason: the recipient
  // comes from the verified session, never from the request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const createdAt = user.created_at ? Date.parse(user.created_at) : NaN;
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > NEW_ACCOUNT_WINDOW_MS) {
    return NextResponse.json({ sent: false, reason: 'not_a_new_account' });
  }

  if (user.app_metadata?.welcome_email_sent_at) {
    return NextResponse.json({ sent: false, reason: 'already_sent' });
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (error) {
    console.error('[welcome] service role client unavailable:', error);
    return NextResponse.json({ sent: false, reason: 'not_configured' }, { status: 503 });
  }

  // Claim the send before making it. Two tabs finishing sign-in together would
  // otherwise both pass the check above and mail the person twice; a duplicate
  // welcome is worse than a missed one. The flag is rolled back below if the
  // send fails, so the next sign-in inside the window retries.
  const { error: claimError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { welcome_email_sent_at: new Date().toISOString() },
  });
  if (claimError) {
    console.error('[welcome] could not record the send:', claimError);
    return NextResponse.json({ sent: false, reason: 'send_failed' }, { status: 500 });
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userRow?.role === 'company' ? 'company' : 'candidate';

  // Google puts the display name in the ID token, which lands in
  // user_metadata as full_name (name on some accounts). Falling back to the
  // local part of the address beats greeting a real person as "there".
  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user.email.split('@')[0];

  const { subject, html, text } = welcomeEmail({ firstName: displayName, role });
  const result = await sendEmail({ to: user.email, subject, html, text });

  if (!result.sent) {
    await admin.auth.admin
      .updateUserById(user.id, { app_metadata: { welcome_email_sent_at: null } })
      .catch(() => {
        // Rollback is best effort. Losing it means this person never gets the
        // welcome mail, which is the harmless direction to fail in.
      });
  }

  return NextResponse.json(result);
}
