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

// ?q= prefills the title search: used by the 404 page's search box and by
// the WebsiteSchema SearchAction on the home page (/jobs?q={search_term}).
export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [jobs, { q }] = await Promise.all([fetchPublicJobs(), searchParams]);
  return (
    <div className="pt-20">
      <JobBoard initialJobs={jobs} initialSearch={typeof q === 'string' ? q.slice(0, 100) : ''} />
    </div>
  );
}
