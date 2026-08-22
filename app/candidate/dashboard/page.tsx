import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import ProfileCompletenessCard from '@/components/candidate/ProfileCompletenessCard';
import AvatarUpload from '@/components/candidate/AvatarUpload';
import { COURSES } from '@/data/courses';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-emerald-100 text-emerald-800',
};

export default async function CandidateDashboard() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Supabase is not configured. Please set your environment variables to
            enable the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Please sign in to view your dashboard.</p>
        </div>
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

  // The CV lives in candidate_documents (multi-document library), not
  // candidate_profiles.cv_url -- that column predates the library and
  // nothing writes to it anymore.
  const { count: cvCount } = await supabase
    .from('candidate_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('doc_type', 'cv');
  const hasCv = (cvCount ?? 0) > 0;

  // Fetch applications
  let totalApplications = 0;
  let shortlistedCount = 0;
  let applicationsLoadFailed = false;
  let recentApplications: {
    id: string;
    status: string;
    created_at: string;
    job: { title: string } | null;
  }[] = [];

  if (candidateId) {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId);
    totalApplications = count ?? 0;

    const { count: shortlisted } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId)
      .eq('status', 'shortlisted');
    shortlistedCount = shortlisted ?? 0;

    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id, status, created_at, job:jobs(title)')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
      .limit(10);

    // A failed read must not render as "you have not applied to any jobs yet".
    if (appsError) {
      console.error('[candidate/dashboard] could not load applications:', appsError.message);
      applicationsLoadFailed = true;
    }

    recentApplications = (apps ?? []).map((a) => ({
      ...a,
      job: Array.isArray(a.job) ? a.job[0] ?? null : a.job,
    }));
  }

  // Document verification status -- profile.verified is a standing badge,
  // flipped only by an explicit admin action (app/admin/candidate-verification),
  // not auto-derived. "Pending" just means at least one verification-type
  // document is awaiting that review.
  let verificationState: 'verified' | 'pending' | 'not_started' = 'not_started';
  if (profile?.verified) {
    verificationState = 'verified';
  } else {
    const { count: pendingVerifications } = await supabase
      .from('candidate_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('verification_status', 'pending');
    if ((pendingVerifications ?? 0) > 0) verificationState = 'pending';
  }

  let pendingInvites = 0;
  if (candidateId) {
    const { count } = await supabase
      .from('job_invites')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId)
      .eq('status', 'pending');
    pendingInvites = count ?? 0;
  }

  // Fetch enrollments count
  let activeEnrollments = 0;
  if (candidateId) {
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId)
      .eq('status', 'enrolled');
    activeEnrollments = count ?? 0;
  }

  // Training progress on the static Academy courses (data/courses.ts), keyed
  // on the auth user directly rather than the candidate profile -- see
  // supabase/add-academy-progress.sql. Grouped client-side since there are
  // only ever a handful of courses.
  const { data: academyRows } = await supabase
    .from('academy_lesson_progress')
    .select('course_slug, lesson_number')
    .eq('user_id', user.id);

  const trainingProgress = COURSES.map((course) => {
    const completed = (academyRows ?? []).filter((r) => r.course_slug === course.slug).length;
    return { course, completed };
  }).filter((p) => p.completed > 0);

  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications,
      color: 'bg-brand-50 text-brand-700',
    },
    {
      label: 'Shortlisted',
      value: shortlistedCount,
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Profile Score',
      value: `${profileScore}%`,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollments,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            fullName={fullName}
            editable={false}
            size="sm"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {fullName}
            </h1>
            <p className="text-slate-500 mt-1">
              Here is what is happening with your job search.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/candidate/profile/preview"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Preview my profile
          </Link>
          <Link
            href="/#jobs"
            className="inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <ProfileCompletenessCard
        profileScore={profileScore}
        profile={{ ...(profile ?? {}), hasCv }}
        hasApplied={totalApplications > 0}
      />

      {/* Talent pool / verification / invites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Profile Verification</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {verificationState === 'verified'
                ? 'Verified — companies see this badge on your profile.'
                : verificationState === 'pending'
                  ? 'Documents submitted, waiting on admin review.'
                  : 'Upload an ID document to start verification.'}
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
              verificationState === 'verified'
                ? 'bg-green-100 text-green-700'
                : verificationState === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {verificationState === 'verified' ? 'Verified' : verificationState === 'pending' ? 'Pending' : 'Not started'}
          </span>
        </div>
        <Link
          href="/candidate/invites"
          className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-3 hover:border-brand-300 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">Invitations</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {pendingInvites > 0
                ? `${pendingInvites} ${pendingInvites === 1 ? 'company wants' : 'companies want'} you to apply`
                : 'Companies can invite you to apply once you opt in'}
            </p>
          </div>
          {pendingInvites > 0 && (
            <span className="shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
              {pendingInvites}
            </span>
          )}
        </Link>
      </div>

      {/* Training progress */}
      {trainingProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Training Progress</h2>
            <Link
              href="/training"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Browse Training
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {trainingProgress.map(({ course, completed }) => {
              const percent = Math.round((completed / course.lessons.length) * 100);
              return (
                <div key={course.slug}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <Link
                      href={`/training/${course.slug}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {course.title}
                    </Link>
                    <span className="text-slate-500">
                      {completed} of {course.lessons.length} lessons
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Applications
          </h2>
        </div>

        {applicationsLoadFailed ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">
              We could not load your applications just now. Please refresh the page,
              and if it keeps happening let us know.
            </p>
          </div>
        ) : recentApplications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">
              You have not applied to any jobs yet.
            </p>
            <Link
              href="/#jobs"
              className="inline-flex items-center mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Job Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {app.job?.title ?? 'Untitled Job'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusColors[app.status] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
