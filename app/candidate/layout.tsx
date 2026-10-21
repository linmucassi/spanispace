import PortalFrame from '@/components/portal/PortalFrame';
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
    <PortalFrame portal="candidate" sidebar={<CandidateSidebar />}>
      {children}
    </PortalFrame>
  );
}
