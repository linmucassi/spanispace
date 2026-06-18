import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spanispace',
    short_name: 'Spanispace',
    description:
      'Vetted jobs, expert-led bootcamps, and verified learnerships for South African graduates and job seekers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity', 'business'],
    icons: [
      {
        src: '/assets/new-logo.png',
        sizes: '300x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
    ],
  };
}
