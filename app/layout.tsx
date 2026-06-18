import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://spanispace.com'),
  title: {
    default: 'Spanispace | Skill-to-Job Bridge',
    template: '%s | Spanispace',
  },
  description:
    'Spanispace bridges South African graduates and job seekers with vetted jobs, expert-led bootcamps, and verified learnerships. Free for candidates, isiZulu and English.',
  keywords: [
    'South Africa jobs',
    'learnerships',
    'graduate jobs',
    'bootcamps',
    'CV builder',
    'isiZulu',
    'Gauteng jobs',
    'youth employment',
    'late university applications',
    'NSFAS',
    'SETA',
  ],
  authors: [{ name: 'Spanispace' }],
  creator: 'Spanispace',
  publisher: 'Spanispace',
  applicationName: 'Spanispace',
  category: 'employment',
  alternates: {
    canonical: '/',
    languages: {
      'en-ZA': '/',
      zu: '/',
    },
  },
  openGraph: {
    title: 'Spanispace | Skill-to-Job Bridge',
    description:
      'Vetted jobs, expert-led bootcamps, and verified learnerships for South African graduates and job seekers.',
    siteName: 'Spanispace',
    type: 'website',
    locale: 'en_ZA',
    alternateLocale: ['zu_ZA'],
    images: [
      {
        url: '/assets/new-logo.png',
        width: 300,
        height: 72,
        alt: 'Spanispace Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Spanispace | Skill-to-Job Bridge',
    description:
      'Vetted jobs, expert-led bootcamps, and verified learnerships for South African graduates and job seekers.',
    images: ['/assets/new-logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/new-logo.png', type: 'image/png', sizes: '300x72' },
    ],
    apple: [{ url: '/assets/new-logo.png' }],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
