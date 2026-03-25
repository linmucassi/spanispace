import CompanySidebar from '@/components/company/CompanySidebar';

export const metadata = {
  title: 'Company Dashboard | Spanispace',
};

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <CompanySidebar />
      <div className="ml-64">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
