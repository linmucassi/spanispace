import Link from 'next/link';
import { ArrowUpRight, BookOpen, FileText, Gauge, Mail, ShieldCheck, Star } from 'lucide-react';
import { createServerSupabase } from '@/lib/supabase/server';
import ProfileCompletenessCard from '@/components/candidate/ProfileCompletenessCard';
import AvatarUpload from '@/components/candidate/AvatarUpload';
import StatCard from '@/components/ui/StatCard';
import { Panel, PageHeader, MeterList, btnPrimary, btnSecondary, type Meter } from '@/components/ui/Panel';
import type { Tone } from '@/components/ui/RingGauge';
import { COURSES } from '@/data/courses';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  reviewed: 'bg-brand-50 text-brand-700 border-brand-100',
  shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  hired: 'bg-violet-50 text-violet-700 border-violet-100',
};

// The pipeline, in the order an application moves through it.
const PIPELINE: { status: string; label: string; tone: Tone }[] = [
  { status: 'pending', label: 'Sent, waiting for review', tone: 'amber' },
  { status: 'reviewed', label: 'Reviewed', tone: 'brand' },
  { status: 'shortlisted', label: 'Shortlisted', tone: 'emerald' },
  { status: 'hired', label: 'Hired', tone: 'violet' },
  { status: 'rejected', label: 'Not this time', tone: 'rose' },
];

const VERIFICATION = {
  verified: { label: 'Verified', text: 'Companies see the verified badge on your profile.', chip: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pending', text: 'Documents submitted, waiting on admin review.', chip: 'bg-amber-50 text-amber-700' },
  not_started: { label: 'Not started', text: 'Upload an ID document to start verification.', chip: 'bg-ink-100 text-ink-500' },
};

export default async function CandidateDashboard() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <Panel>
          <p className="text-center text-ink-500">
            Supabase is not configured. Please set your environment variables to
            enable the dashboard.
          </p>
        </Panel>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <Panel>
          <p className="text-center text-ink-500">Please sign in to view your dashboard.</p>
        </Panel>
      </div>
    );
  }

  // Fetch candidate profile
  // select('*') here (rather than an explicit list) so this page keeps
  // working whether or not open_to_offers/verified-adjacent columns have
  // landed yet -- see supabase/add-talent-sourcing-and-verification.sql.
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const candidateId = profile?.id;
  const fullName = profile?.full_name ?? user.email?.split('@')[0] ?? 'there';
  const profileScore = profile?.profile_score ?? 0;

  // Everything below only depends on user.id/candidateId, both already
  // known -- fire all of it in parallel instead of one await after another.
  // This page had grown to 8+ sequential round trips (each ~150-300ms
  // measured against the live project), compounding into multi-second loads
  // on every visit; Promise.all turns that into "slowest one query" instead
  // of "sum of all of them."
  const noCount = Promise.resolve({ count: 0 as number | null });
  const noRows = Promise.resolve({ data: null, error: null });

  const [
    cvCountRes,
    applicationStatusesRes,
    recentApplicationsRes,
    pendingVerificationsRes,
    pendingInvitesRes,
    activeEnrollmentsRes,
    academyRes,
    serviceProviderRes,
  ] = await Promise.all([
    // The CV lives in candidate_documents (multi-document library), not
    // candidate_profiles.cv_url -- that column predates the library and
    // nothing writes to it anymore.
    supabase.from('candidate_documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('doc_type', 'cv'),
    // Statuses only: the pipeline chart and both counts come from this one read.
    candidateId
      ? supabase.from('applications').select('status').eq('candidate_id', candidateId)
      : noRows,
    candidateId
      ? supabase.from('applications').select('id, status, created_at, job:jobs(title)').eq('candidate_id', candidateId).order('created_at', { ascending: false }).limit(6)
      : noRows,
    // Document verification status -- profile.verified is a standing badge,
    // flipped only by an explicit admin action
    // (app/admin/candidate-verification), not auto-derived. "Pending" just
    // means at least one verification-type document is awaiting that
    // review. Skipped entirely once already verified.
    profile?.verified
      ? noCount
      : supabase.from('candidate_documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('verification_status', 'pending'),
    candidateId
      ? supabase.from('job_invites').select('*', { count: 'exact', head: true }).eq('candidate_id', candidateId).eq('status', 'pending')
      : noCount,
    candidateId
      ? supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('candidate_id', candidateId).eq('status', 'enrolled')
      : noCount,
    // Training progress on the static Academy courses (data/courses.ts),
    // keyed on the auth user directly rather than the candidate profile --
    // see supabase/add-academy-progress.sql.
    supabase.from('academy_lesson_progress').select('course_slug, lesson_number').eq('user_id', user.id),
    // Signed up via the "I offer services" tab: nudge them back to the
    // enrolment wizard until they've started it (email-confirmation signups
    // land here, not on the wizard). See app/(auth)/register/page.tsx.
    user.user_metadata?.signup_intent === 'services'
      ? supabase.from('service_providers').select('id').eq('user_id', user.id).maybeSingle()
      : noRows,
  ]);

  const showServicesNudge = user.user_metadata?.signup_intent === 'services' && !serviceProviderRes.error && !serviceProviderRes.data;

  const hasCv = (cvCountRes.count ?? 0) > 0;
  const statuses = ((applicationStatusesRes.data as { status: string }[] | null) ?? []).map((a) => a.status);
  const totalApplications = statuses.length;
  const shortlistedCount = statuses.filter((st) => st === 'shortlisted').length;
  const pipeline: Meter[] = PIPELINE.map((step) => ({
    label: step.label,
    value: statuses.filter((st) => st === step.status).length,
    tone: step.tone,
  }));

  // A failed read must not render as "you have not applied to any jobs yet".
  const applicationsLoadFailed = Boolean('error' in recentApplicationsRes && recentApplicationsRes.error);
  if (applicationsLoadFailed) {
    console.error('[candidate/dashboard] could not load applications:', (recentApplicationsRes as any).error?.message);
  }
  const recentApplications = ((recentApplicationsRes.data as any[]) ?? []).map((a) => ({
    ...a,
    job: Array.isArray(a.job) ? a.job[0] ?? null : a.job,
  }));

  const verificationState: 'verified' | 'pending' | 'not_started' = profile?.verified
    ? 'verified'
    : (pendingVerificationsRes.count ?? 0) > 0
      ? 'pending'
      : 'not_started';
  const verification = VERIFICATION[verificationState];

  const pendingInvites = pendingInvitesRes.count ?? 0;
  const activeEnrollments = activeEnrollmentsRes.count ?? 0;

  const academyRows = academyRes.data;
  const trainingProgress = COURSES.map((course) => {
    const completed = (academyRows ?? []).filter((r) => r.course_slug === course.slug).length;
    return { course, completed };
  }).filter((p) => p.completed > 0);

  const firstName = fullName.split(' ')[0];

  return (
    <div className="space-y-6">
      {showServicesNudge && (
        <div className="flex flex-col justify-between gap-3 rounded-3xl border border-brand-100 bg-brand-50 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-brand-900">Finish setting up your services</p>
            <p className="text-sm text-brand-700">Add your rate card and upload your verification documents to start receiving bookings.</p>
          </div>
          <Link href="/candidate/piecejobs/enrol" className={`${btnPrimary} shrink-0`}>
            Continue
          </Link>
        </div>
      )}

      <PageHeader
        leading={<AvatarUpload userId={user.id} avatarUrl={profile?.avatar_url ?? null} fullName={fullName} editable={false} size="sm" />}
        title="Welcome back,"
        muted={firstName}
        subtitle="Here is what is happening with your job search."
        actions={
          <>
            <Link href="/candidate/profile/preview" className={btnSecondary}>Preview my profile</Link>
            <Link href="/jobs" className={btnPrimary}>
              Browse jobs <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={totalApplications}
          icon={FileText}
          href="/candidate/applications"
          hint={totalApplications === 0 ? 'Apply to your first job to get started' : `${shortlistedCount} shortlisted so far`}
        />
        <StatCard
          label="Shortlisted"
          value={shortlistedCount}
          icon={Star}
          tone="emerald"
          ring={totalApplications > 0 ? { value: shortlistedCount, max: totalApplications } : undefined}
          hint={totalApplications > 0 ? 'Share of your applications' : 'Shortlists show up here'}
        />
        <StatCard
          label="Profile score"
          value={`${profileScore}%`}
          icon={Gauge}
          tone="amber"
          href="/candidate/profile"
          ring={{ value: profileScore }}
          hint="Higher scores rank first in company searches"
        />
        <StatCard
          label="Enrollments"
          value={activeEnrollments}
          icon={BookOpen}
          tone="violet"
          href="/candidate/enrollments"
          hint={activeEnrollments === 0 ? 'Courses you join show up here' : 'Active courses'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ProfileCompletenessCard
            profileScore={profileScore}
            profile={{ ...(profile ?? {}), hasCv }}
            hasApplied={totalApplications > 0}
          />

          <Panel
            title="Recent applications"
            action={
              totalApplications > 0 && (
                <Link href="/candidate/applications" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  View all
                </Link>
              )
            }
            bodyClassName="p-3 pt-4"
          >
            {applicationsLoadFailed ? (
              <p className="p-6 text-center text-ink-500">
                We could not load your applications just now. Please refresh the page,
                and if it keeps happening let us know.
              </p>
            ) : recentApplications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-ink-500">You have not applied to any jobs yet.</p>
                <Link href="/jobs" className={`${btnPrimary} mt-4`}>
                  Browse jobs
                </Link>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentApplications.map((app) => (
                  <li key={app.id} className="flex items-center gap-4 rounded-2xl px-3 py-3 hover:bg-ink-50">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-400">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{app.job?.title ?? 'Untitled job'}</p>
                      <p className="text-xs text-ink-400">
                        Applied {new Date(app.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        statusColors[app.status] ?? 'border-ink-100 bg-ink-50 text-ink-600'
                      }`}
                    >
                      {app.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Application pipeline" subtitle={totalApplications > 0 ? `${totalApplications} in total` : 'Nothing sent yet'}>
            <MeterList items={pipeline} max={Math.max(1, totalApplications)} />
          </Panel>

          <Panel bodyClassName="p-3">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">Profile verification</p>
                <p className="text-xs text-ink-400">{verification.text}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${verification.chip}`}>{verification.label}</span>
            </div>
            <Link href="/candidate/invites" className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-ink-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">Invitations</p>
                <p className="text-xs text-ink-400">
                  {pendingInvites > 0
                    ? `${pendingInvites} ${pendingInvites === 1 ? 'company wants' : 'companies want'} you to apply`
                    : 'Companies can invite you to apply once you opt in'}
                </p>
              </div>
              {pendingInvites > 0 && (
                <span className="shrink-0 rounded-lg bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">{pendingInvites}</span>
              )}
            </Link>
          </Panel>

          {trainingProgress.length > 0 && (
            <Panel
              title="Training progress"
              action={
                <Link href="/training" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Browse
                </Link>
              }
            >
              <MeterList
                max={100}
                items={trainingProgress.map(({ course, completed }) => ({
                  label: (
                    <Link href={`/training/${course.slug}`} className="hover:text-brand-600">
                      {course.title}
                    </Link>
                  ),
                  value: Math.round((completed / course.lessons.length) * 100),
                  suffix: `${completed}/${course.lessons.length}`,
                  tone: 'violet' as const,
                }))}
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
