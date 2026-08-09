import type { Metadata } from 'next';
import JobBoard from '@/components/JobBoard';
import { fetchPublicJobs } from '@/lib/publicJobs';

export const metadata: Metadata = {
  title: 'Vetted Jobs in South Africa',
  description:
    'Browse vetted job listings across South Africa. Remote, hybrid, on site and learnership opportunities for graduates and job seekers.',
  alternates: { canonical: '/jobs' },
};

export const revalidate = 300;

export default async function JobsPage() {
  const jobs = await fetchPublicJobs();
  return (
    <div className="pt-20">
      <JobBoard initialJobs={jobs} />
    </div>
  );
}
