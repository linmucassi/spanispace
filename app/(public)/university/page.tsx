import type { Metadata } from 'next';
import AcademicPortal from '@/components/AcademicPortal';
import { fetchPublicUniApps } from '@/lib/publicAcademic';

export const metadata: Metadata = {
  title: 'University deadlines and learnerships',
  description:
    'Late university application deadlines, learnerships and vocational training dates across South African institutions, so you never miss a closing date.',
  alternates: { canonical: '/university' },
};

export const revalidate = 3600; // refresh once per hour

export default async function UniversityPage() {
  const updates = await fetchPublicUniApps();
  return (
    <div className="pt-20">
      <AcademicPortal updates={updates} />
    </div>
  );
}
