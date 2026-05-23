import type { Metadata } from 'next';
import { fetchPublicJob } from '@/lib/publicJobs';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchPublicJob(id);

  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'This job listing could not be found on Spanispace.',
    };
  }

  return {
    title: `${job.role} at ${job.company}`,
    description:
      job.description?.slice(0, 160) ||
      `${job.role} (${job.type}) at ${job.company} in ${job.location}. ${job.vettedStatus} listing on Spanispace.`,
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: {
      title: `${job.role} at ${job.company}`,
      description: `${job.type} role in ${job.location}. ${job.vettedStatus}.`,
      type: 'article',
      url: `https://spanispace.com/jobs/${job.id}`,
    },
  };
}

export default function JobLayout({ children }: Props) {
  return <>{children}</>;
}
