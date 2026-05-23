import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Spanispace',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="pt-8 pb-4 flex justify-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition-colors">
            S
          </div>
          <span className="text-slate-900 font-bold text-lg">Spanispace</span>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-12">
        {children}
      </div>
    </div>
  );
}
