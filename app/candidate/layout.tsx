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
      <div className="md:ml-64">
        <div className="p-4 sm:p-6 md:p-8 pt-20 md:pt-8">{children}</div>
      </div>
    </div>
  );
}
