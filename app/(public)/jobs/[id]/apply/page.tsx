import { notFound, redirect } from 'next/navigation';
import { fetchPublicJob } from '@/lib/publicJobs';
import ApplyForm from './ApplyForm';

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export default async function ApplyPage({ params }: Props) {
  const { id } = await params;
  const job = await fetchPublicJob(id);

  if (!job) {
    notFound();
  }

  const isExpired = new Date(job.expiryDate) < new Date();
  if (isExpired) {
    redirect(`/jobs/${id}`);
  }

  return (
    <ApplyForm
      jobId={job.id}
      jobRole={job.role}
      jobCompany={job.company}
      jobSource={job.source}
      applyMode={job.applyMode ?? 'on_platform'}
      applyLink={job.applyLink || null}
    />
  );
}
