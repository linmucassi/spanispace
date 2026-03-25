import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';

const statusColors: Record<string, string> = {
  enrolled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  dropped: 'bg-slate-100 text-slate-600',
};

const progressBarColors: Record<string, string> = {
  enrolled: 'bg-indigo-600',
  completed: 'bg-green-600',
  dropped: 'bg-slate-400',
};

export const metadata = {
  title: 'Enrollments | Spanispace',
};

export default async function CandidateEnrollmentsPage() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Enrollments</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Supabase is not configured. Please set your environment variables.
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
        <h1 className="text-2xl font-bold text-slate-900">My Enrollments</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Please sign in to view your enrollments.
          </p>
        </div>
      </div>
    );
  }

  // Fetch candidate profile
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let enrollments: {
    id: string;
    status: string;
    progress: number;
    created_at: string;
    training: {
      id: string;
      title: string;
      category: string;
      format: string | null;
    } | null;
  }[] = [];

  if (profile?.id) {
    const { data } = await supabase
      .from('enrollments')
      .select(
        'id, status, progress, created_at, training:trainings(id, title, category, format)'
      )
      .eq('candidate_id', profile.id)
      .order('created_at', { ascending: false });

    enrollments = (data ?? []).map((e) => ({
      ...e,
      progress: e.progress ?? 0,
      training: Array.isArray(e.training)
        ? e.training[0] ?? null
        : e.training,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Enrollments</h1>
          <p className="text-slate-500 mt-1">
            Track your progress across training programs.
          </p>
        </div>
        <Link
          href="/#training"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Browse Training
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            No enrollments yet. Browse our training programs to get started.
          </p>
          <Link
            href="/#training"
            className="inline-flex items-center mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Training
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {enrollment.training?.title ?? 'Unknown Training'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {enrollment.training?.category && (
                      <span className="text-xs text-slate-500">
                        {enrollment.training.category}
                      </span>
                    )}
                    {enrollment.training?.format && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-500 capitalize">
                          {enrollment.training.format}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    statusColors[enrollment.status] ??
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  {enrollment.status}
                </span>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progress</span>
                  <span>{enrollment.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressBarColors[enrollment.status] ?? 'bg-slate-400'
                    }`}
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
              </div>

              {/* Enrolled date */}
              <p className="text-xs text-slate-400">
                Enrolled{' '}
                {new Date(enrollment.created_at).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
