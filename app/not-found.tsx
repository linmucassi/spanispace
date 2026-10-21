import type { Metadata } from 'next';
import { Orbitron } from 'next/font/google';
import NotFound404 from '@/components/NotFound404';

// The 404's display face, self-hosted at build like the rest of the site's
// fonts (no runtime call to Google). Only this page uses it.
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['600', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFound404 displayFont={orbitron.variable} />;
}
