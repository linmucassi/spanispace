import type { Metadata } from 'next';
import JobBoard from '@/components/JobBoard';

export const metadata: Metadata = {
  title: 'Vetted Jobs in South Africa',
  description:
    'Browse vetted job listings across South Africa — remote, hybrid, on-site, and learnership opportunities for graduates and job seekers.',
  alternates: { canonical: '/jobs' },
};

export default function JobsPage() {
  return (
    <div className="pt-20">
      <JobBoard />
    </div>
  );
}
