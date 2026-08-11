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
    // Matches the hero background and the browser theme colour, so the install
    // splash and the phone status bar are the brand navy, not slate.
    theme_color: '#0b1a2e',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity', 'business'],
    // A real icon set. The old array had one 300x72 wordmark, which is not
    // square, so an installed shortcut showed a letterboxed strip, and the
    // maskable slot Android needs was absent, so it fell back to a screenshot.
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
