import PortalFrame from '@/components/portal/PortalFrame';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Spanispace',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalFrame portal="admin" sidebar={<AdminSidebar />}>
      {children}
    </PortalFrame>
  );
}
