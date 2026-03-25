import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ApplicationList from './ApplicationList';

export default async function CompanyApplications() {
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

  if (!company) redirect('/');

  // Get job IDs for this company
  const { data: companyJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('company_id', company.id);

  const jobIds = (companyJobs ?? []).map((j) => j.id);

  let applications: any[] = [];

  if (jobIds.length > 0) {
    const { data } = await supabase
      .from('applications')
      .select('*, job:jobs(title)')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    applications = (data as any[]) ?? [];
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Applications</h1>
        <p className="text-slate-500 text-sm">
          Review and manage applications for your job listings
        </p>
      </div>

      <ApplicationList initialApplications={applications} />
    </div>
  );
}
