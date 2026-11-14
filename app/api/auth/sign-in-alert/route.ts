// "New sign-in to your account" email (issue #28).
//
// Called fire-and-forget by the client right after a successful password or
// Google sign-in. Like /api/auth/welcome, the recipient comes from the
// verified session (getUser revalidates the token with Supabase), never from
// the request body, so this can't be used to mail an arbitrary address.
//
// Skipped when:
//   - the account is under NEW_ACCOUNT_WINDOW_MS old: the person just signed
//     up and already gets a confirmation or welcome email, so a "new sign-in"
//     alert on top of that is noise.
//   - an alert went out less than DEDUPE_WINDOW_MS ago. Two tabs, a double
//     click or a retry would otherwise mail the person twice. The timestamp
//     lives in app_metadata, which the user's own token can't write.

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isEmailConfigured, sendEmail, signInAlertEmail } from '@/lib/email';

const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;
const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

// Rough "Chrome on Windows" from the User-Agent. Good enough for a person to
// recognise their own device; exact versions add nothing.
function describeDevice(ua: string | null): string | null {
  if (!ua) return null;
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : null;
  const os =
    /iPhone|iPad|iPod/.test(ua) ? 'iPhone or iPad'
    : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
    : /CrOS/.test(ua) ? 'Chromebook'
    : /Linux/.test(ua) ? 'Linux'
    : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os;
}

// Netlify sets x-nf-geo to base64 JSON ({ city, country: { name }, ... }).
// City and country only: the IP address stays out of the email.
function describeLocation(header: string | null): string | null {
  if (!header) return null;
  try {
    const geo = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
    const parts = [geo?.city, geo?.country?.name].filter(
      (part): part is string => typeof part === 'string' && part.length > 0
    );
    return parts.length ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ sent: false, reason: 'not_configured' });
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ sent: false, reason: 'not_configured' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const now = Date.now();
  const createdAt = user.created_at ? Date.parse(user.created_at) : NaN;
  if (Number.isFinite(createdAt) && now - createdAt < NEW_ACCOUNT_WINDOW_MS) {
    return NextResponse.json({ sent: false, reason: 'new_account' });
  }

  const lastAlert = Date.parse(String(user.app_metadata?.sign_in_alert_sent_at ?? ''));
  if (Number.isFinite(lastAlert) && now - lastAlert < DEDUPE_WINDOW_MS) {
    return NextResponse.json({ sent: false, reason: 'recently_sent' });
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (error) {
    console.error('[sign-in-alert] service role client unavailable:', error);
    return NextResponse.json({ sent: false, reason: 'not_configured' }, { status: 503 });
  }

  // Claim before sending, as in the welcome route: a missed alert is better
  // than a duplicate one.
  const { error: claimError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { sign_in_alert_sent_at: new Date(now).toISOString() },
  });
  if (claimError) {
    console.error('[sign-in-alert] could not record the send:', claimError);
    return NextResponse.json({ sent: false, reason: 'send_failed' }, { status: 500 });
  }

  // The session's own identities say how this sign-in happened. The newest
  // last_sign_in_at wins when an account has both a password and Google.
  const identities = [...(user.identities ?? [])].sort(
    (a, b) => Date.parse(b.last_sign_in_at ?? '') - Date.parse(a.last_sign_in_at ?? '')
  );
  const method = identities[0]?.provider === 'google' ? 'google' : 'password';

  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user.email.split('@')[0];

  const when = new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  }).format(new Date(now)) + ' (SAST)';

  const { subject, html, text } = signInAlertEmail({
    firstName: displayName,
    when,
    method,
    device: describeDevice(request.headers.get('user-agent')),
    location: describeLocation(request.headers.get('x-nf-geo')),
  });

  const result = await sendEmail({ to: user.email, subject, html, text });
  return NextResponse.json(result);
}
