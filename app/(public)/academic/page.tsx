import type { Metadata } from 'next';
import AcademicPortal from '@/components/AcademicPortal';
import { fetchPublicUniApps } from '@/lib/publicAcademic';

export const metadata: Metadata = {
  title: 'Late University Applications & Learnerships',
  description:
    'Track South African late university application deadlines, learnerships, and vocational training dates so you never miss out.',
  alternates: { canonical: '/academic' },
};

export const revalidate = 3600; // refresh once per hour

export default async function AcademicPage() {
  const updates = await fetchPublicUniApps()
  return (
    <div className="pt-20">
      <AcademicPortal updates={updates} />
    </div>
  );
}
