import { createServerSupabase } from '@/lib/supabase/server';
import { JOBS as STATIC_JOBS } from '@/data/constants';
import type { Job } from '@/types';
import { VettedStatus } from '@/types';

type DbJob = {
  id: string;
  title: string;
  location: string;
  job_type: string;
  expiry_date: string;
  vetted_status: string;
  status: string;
  apply_link: string | null;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  company_profiles: { company_name: string } | null;
};

function mapDbJob(row: DbJob): Job {
  const companyName = row.company_profiles?.company_name ?? 'Spanispace Partner';

  return {
    id: row.id,
    role: row.title,
    company: companyName,
    location: row.location,
    type: row.job_type as Job['type'],
    applyLink: row.apply_link ?? '',
    expiryDate: row.expiry_date,
    vettedStatus:
      row.vetted_status === 'verified'
        ? VettedStatus.VERIFIED
        : VettedStatus.SKILLS_ASSESSED,
  };
}

export async function fetchPublicJobs(): Promise<Job[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return STATIC_JOBS;

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `id, title, location, job_type, expiry_date, vetted_status, status,
       apply_link, description, requirements, salary_range,
       company_profiles ( company_name )`
    )
    .eq('vetted_status', 'verified')
    .eq('status', 'active')
    .gte('expiry_date', today)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return STATIC_JOBS;
  }

  return (data as unknown as DbJob[]).map(mapDbJob);
}

export type PublicJobDetail = Job & {
  description?: string;
  requirements?: string | null;
  salaryRange?: string | null;
  source: 'db' | 'static';
};

export async function fetchPublicJob(id: string): Promise<PublicJobDetail | null> {
  const supabase = await createServerSupabase();

  if (supabase) {
    const { data } = await supabase
      .from('jobs')
      .select(
        `id, title, location, job_type, expiry_date, vetted_status, status,
         apply_link, description, requirements, salary_range,
         company_profiles ( company_name )`
      )
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle();

    if (data) {
      const row = data as unknown as DbJob;
      const base = mapDbJob(row);
      return {
        ...base,
        description: row.description,
        requirements: row.requirements,
        salaryRange: row.salary_range,
        source: 'db',
      };
    }
  }

  const fallback = STATIC_JOBS.find((j) => j.id === id);
  if (!fallback) return null;
  return { ...fallback, source: 'static' };
}
