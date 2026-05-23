import CompanySidebar from '@/components/company/CompanySidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Company Dashboard | Spanispace',
  robots: { index: false, follow: false },
};

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <CompanySidebar />
      <div className="md:ml-64">
        <div className="p-4 sm:p-6 md:p-8 pt-20 md:pt-8">{children}</div>
      </div>
    </div>
  );
}
