// Job applications, submitted server side.
//
// This used to be a bare supabase.from('applications').insert() in ApplyForm.
// It moved here for three reasons that GitHub issue #4 all reported at once:
//   - the confirmation email has to be sent by something holding RESEND_API_KEY,
//     and it must only fire for an application this server actually wrote
//   - a signed-in candidate with no candidate_profiles row was silently written
//     with candidate_id NULL, which orphaned the application from their
//     dashboard forever, so the profile is provisioned here before the insert
//   - a duplicate has to be reported as a duplicate, not as a raw Postgres
//     unique-violation string shown to the applicant
//
// Uses the anon key through the cookie-scoped client, so RLS still applies and
// the service-role client stays out of request handlers, per lib/supabase/admin.ts.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { applicationReceivedEmail, sendEmail } from '@/lib/email';

// Per-instance throttle. Netlify runs this as a serverless function so the
// window is not shared across instances and resets on deploy, the same
// trade-off the rest of the app makes. It is a speed bump against a script
// hammering an open endpoint, not a security control.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_KEYS = 5000;
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();

  // Bounded, so a long lived instance being sprayed with unique keys cannot
  // grow the map without limit.
  if (recentSubmissions.size > RATE_LIMIT_MAX_KEYS) {
    for (const [k, times] of recentSubmissions) {
      if (times.every((at) => now - at >= RATE_LIMIT_WINDOW_MS)) {
        recentSubmissions.delete(k);
      }
    }
    if (recentSubmissions.size > RATE_LIMIT_MAX_KEYS) recentSubmissions.clear();
  }

  const hits = (recentSubmissions.get(key) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS
  );
  if (hits.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(key, hits);
    return true;
  }
  hits.push(now);
  recentSubmissions.set(key, hits);
  return false;
}

// Control characters are stripped, not just trimmed. Anything here can end up
// in an outbound email, and a CR or LF in a value that reaches a mail header is
// a header injection waiting to happen.
function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.jobId !== 'string') {
    return NextResponse.json({ error: 'Missing jobId.' }, { status: 400 });
  }

  const jobId = body.jobId.trim();
  const fullName = text(body.fullName, 200);
  const phone = text(body.phone, 40);

  if (!fullName || !phone) {
    return NextResponse.json(
      { error: 'Your full name and phone number are required.' },
      { status: 400 }
    );
  }

  const email = text(body.email, 320);
  if (email && !email.includes('@')) {
    return NextResponse.json(
      { error: 'That email address does not look right.' },
      { status: 400 }
    );
  }

  const whatsapp = text(body.whatsapp, 40);
  const location = text(body.location, 200);
  const aboutYou = text(body.aboutYou, 5000);
  const documentIds: string[] = Array.isArray(body.documentIds)
    ? body.documentIds.filter((id: unknown) => typeof id === 'string').slice(0, 20)
    : [];

  const clientKey =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: 'Too many applications from this connection. Please try again shortly.' },
      { status: 429 }
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve, and if necessary create, the candidate profile. Without a profile
  // row the application has no owner and cannot be shown back to them or
  // deduplicated, which is the whole of bugs 2 and 3 in issue #4.
  let candidateId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.id) {
      candidateId = profile.id;
    } else {
      const { data: created, error: createError } = await supabase
        .from('candidate_profiles')
        .insert({
          user_id: user.id,
          full_name: fullName,
          phone,
          whatsapp,
          location,
        })
        .select('id')
        .maybeSingle();

      if (createError) {
        // A company account applying, or RLS refusing, is not fatal. The
        // application is still worth recording, it just stays unowned.
        console.error('[applications] could not provision candidate profile:', createError.message);
      }
      candidateId = created?.id ?? null;
    }
  }

  // Already applied? Only answerable for a signed-in candidate, an anonymous
  // applicant has no identity to match on.
  if (candidateId) {
    const { data: existing } = await supabase
      .from('applications')
      .select('id, created_at')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: 'You have already applied for this job.',
          alreadyApplied: true,
          appliedAt: existing.created_at,
        },
        { status: 409 }
      );
    }
  }

  // Attachments are resolved from the candidate's own library rather than
  // trusted from the request, so a caller cannot staple arbitrary URLs to an
  // application. RLS scopes candidate_documents to the signed-in user already.
  let documents: { name: string; doc_type: string; file_url: string }[] = [];
  let cvUrl: string | null = null;
  if (user && documentIds.length > 0) {
    const { data: docs } = await supabase
      .from('candidate_documents')
      .select('name, doc_type, file_url')
      .eq('user_id', user.id)
      .in('id', documentIds);

    documents = docs ?? [];
    cvUrl = documents.find((d) => d.doc_type === 'cv')?.file_url ?? null;
  }

  const { error: insertError } = await supabase.from('applications').insert({
    job_id: jobId,
    candidate_id: candidateId,
    full_name: fullName,
    phone,
    whatsapp,
    email,
    location,
    about_you: aboutYou,
    cv_url: cvUrl,
    documents,
  });

  if (insertError) {
    // The partial unique index on (candidate_id, job_id) cannot be inferred by
    // PostgREST's upsert, so the duplicate arrives here as a raw 23505.
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'You have already applied for this job.', alreadyApplied: true },
        { status: 409 }
      );
    }
    console.error('[applications] insert failed:', insertError.code, insertError.message);
    return NextResponse.json(
      { error: 'We could not save your application. Please try again.' },
      { status: 500 }
    );
  }

  // Confirmation email, best effort. The application is already saved, so a
  // missing API key or a Resend outage must never turn a successful
  // application into a failed one.
  //
  // Nothing the caller sent is allowed to shape this email. The subject and
  // body carry the job title and company read back from the database, and a
  // signed-in applicant is written to on their account address rather than on
  // whatever the form said. Otherwise an unauthenticated POST could put
  // arbitrary text in a message signed by the spanispace.com domain.
  let emailSent = false;
  const recipient = user?.email ?? email;
  // Throttled per address as well as per connection, so no one address can be
  // mailed repeatedly from rotating IPs. The application is already saved, a
  // suppressed email never fails the request.
  if (recipient && !isRateLimited(`mail:${recipient.toLowerCase()}`)) {
    const { data: job } = await supabase
      .from('jobs')
      .select('title, poster_name, company_profiles(company_name)')
      .eq('id', jobId)
      .maybeSingle();

    // If the job cannot be read back, say nothing about which job it was
    // rather than falling back to caller-supplied text.
    const companyProfiles = job?.company_profiles as
      | { company_name: string }
      | { company_name: string }[]
      | null
      | undefined;
    const company = Array.isArray(companyProfiles)
      ? companyProfiles[0]?.company_name
      : companyProfiles?.company_name;

    const result = await sendEmail({
      to: recipient,
      ...applicationReceivedEmail({
        fullName,
        jobTitle: job?.title ?? 'the role you applied for',
        company: company ?? job?.poster_name ?? 'the employer',
      }),
    });
    emailSent = result.sent;
  }

  return NextResponse.json({ ok: true, emailSent }, { status: 201 });
}
