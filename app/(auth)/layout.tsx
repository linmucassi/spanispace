import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Spanispace',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // Sky wash with the form on a frosted card (soft-UI redesign, 21 Oct 2026).
    <div className="bg-sky-wash min-h-screen flex flex-col">
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
        <div className="panel-glass flex w-full max-w-[34rem] justify-center px-6 py-10 sm:px-10">{children}</div>
      </div>
    </div>
  );
}
