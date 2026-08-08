import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublicJob } from '@/lib/publicJobs';
import JsonLd from '@/components/JsonLd';
import JobDetailView from './JobDetailView';

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await fetchPublicJob(id);

  if (!job) {
    notFound();
  }

  const employmentTypeMap: Record<string, string> = {
    Remote: 'FULL_TIME',
    Hybrid: 'FULL_TIME',
    'On-site': 'FULL_TIME',
    Learnership: 'INTERN',
    Internship: 'INTERN',
    'Hybrid & Remote possible': 'FULL_TIME',
    'Learnership (Hybrid)': 'INTERN',
    'Learnership (On-site)': 'INTERN',
    Contract: 'CONTRACTOR',
    'Full-time': 'FULL_TIME',
    'Part-time': 'PART_TIME',
    'Once-off': 'TEMPORARY',
  };

  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.role,
    description:
      job.description || `${job.role} at ${job.company}. ${job.vettedStatus} listing on Spanispace.`,
    datePosted: new Date().toISOString().split('T')[0],
    validThrough: job.expiryDate,
    employmentType: employmentTypeMap[job.type] ?? 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: 'https://spanispace.com',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'ZA',
      },
    },
    ...(job.type === 'Remote' && {
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'South Africa',
      },
    }),
    directApply: true,
    url: `https://spanispace.com/jobs/${job.id}`,
  };

  return (
    <>
      <JsonLd data={jobPostingSchema} />
      <JobDetailView job={job} />
      {job.source === 'static' && (
        <div className="max-w-3xl mx-auto px-4 pb-8 -mt-6">
          <div className="text-xs text-ink-400 text-center">
            <Link href="/jobs" className="hover:underline">
              ← Back to all jobs
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
