import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Admin | Spanispace',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="ml-64">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
