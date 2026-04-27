import type { Metadata } from 'next';
import AcademicPortal from '@/components/AcademicPortal';

export const metadata: Metadata = {
  title: 'Late University Applications & Learnerships',
  description:
    'Track South African late university application deadlines, learnerships, and vocational training dates so you never miss out.',
  alternates: { canonical: '/academic' },
};

export default function AcademicPage() {
  return (
    <div className="pt-20">
      <AcademicPortal />
    </div>
  );
}
