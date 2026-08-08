import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TrainingActions from './TrainingActions';

function VettedBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-slate-200 text-slate-600',
    draft: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

export default async function CompanyTraining() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: company } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!company) redirect('/company/profile');

  const { data: trainings } = await supabase
    .from('trainings')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Training & Bootcamps</h1>
          <p className="text-slate-500 text-sm">
            Run your own training programmes for candidates
          </p>
        </div>
        <Link
          href="/company/training/new"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
        >
          + New Training
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {!trainings || trainings.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No training programmes yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Create a bootcamp or short course to offer candidates directly.
            </p>
            <Link
              href="/company/training/new"
              className="inline-flex bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all"
            >
              Create Your First Training
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">Review</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainings.map((training) => (
                  <tr key={training.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {training.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {training.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {training.start_date || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <VettedBadge status={training.vetted_status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={training.status} />
                    </td>
                    <td className="px-6 py-4">
                      <TrainingActions trainingId={training.id} currentStatus={training.status} />
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
