import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post a Job (Free)',
  description:
    'Post a job for free on Spanispace and reach thousands of South African graduates and job seekers.',
  alternates: { canonical: '/post-job' },
};

export default function PostJobLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
