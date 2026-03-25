import CandidateSidebar from '@/components/candidate/CandidateSidebar';

export const metadata = {
  title: 'Dashboard | Spanispace',
};

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSidebar />
      <div className="ml-64">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
