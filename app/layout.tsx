import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Archivo, Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

// Archivo carries the headlines. It is wide, confident and slightly squared,
// which echoes the SPAN mark, and it is a different voice from the Inter that
// every generated template defaults to for everything. Inter stays for body
// copy, where it is unbeaten at small sizes on a cheap phone screen.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0b1a2e',
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
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    // iOS never reads the manifest, so this PNG is the only thing between an
    // iPhone home-screen install and a screenshot of the page. Must be a square
    // opaque PNG, which .ico is not, which is why installs looked broken.
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
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
      <body className={`${inter.variable} ${archivo.variable} ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
