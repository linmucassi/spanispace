import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://spanispace.com'),
  title: 'Spanispace | Skill-to-Job Bridge',
  description:
    'The ultimate platform for fresh graduates and job hunters to bridge the gap between skills and careers.',
  openGraph: {
    title: 'Spanispace | Skill-to-Job Bridge',
    description:
      'Expert-led training, vetted job opportunities, and professional CV curation for fresh graduates and job seekers.',
    siteName: 'Spanispace',
    type: 'website',
    images: [{ url: '/assets/logo.png', width: 512, height: 512, alt: 'Spanispace Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Spanispace | Skill-to-Job Bridge',
    description:
      'Expert-led training, vetted job opportunities, and professional CV curation for fresh graduates and job seekers.',
    images: ['/assets/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-pt-20">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
