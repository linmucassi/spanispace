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
        <Link href="/">
          <img
            src="/assets/logo-wordmark.png"
            alt="Spanispace"
            className="h-10 w-auto md:h-12"
          />
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-12">
        {children}
      </div>
    </div>
  );
}
