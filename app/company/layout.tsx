import PortalFrame from '@/components/portal/PortalFrame';
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
    <PortalFrame portal="company" sidebar={<CompanySidebar />}>
      {children}
    </PortalFrame>
  );
}
