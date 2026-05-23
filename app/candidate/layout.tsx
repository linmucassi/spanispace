import CandidateSidebar from '@/components/candidate/CandidateSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Spanispace',
  robots: { index: false, follow: false },
};

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSidebar />
      <div className="md:ml-64">
        <div className="p-4 sm:p-6 md:p-8 pt-20 md:pt-8">{children}</div>
      </div>
    </div>
  );
}
