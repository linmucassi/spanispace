import type { NextConfig } from "next";

// Baseline security headers, applied to every route including SSR and edge,
// which a static Netlify [[headers]] block does not cover. A full
// Content-Security-Policy is deliberately absent: Next's inline scripts need a
// nonce or a hash, and a wrong CSP takes the site down. Add CSP separately, in
// report only mode first.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async redirects() {
    // The nav used to carry Training, Academy and Academic side by side, which
    // nobody could tell apart. Everything learning related is Training now, and
    // Academic is University. Both old paths are indexed and were shared, so
    // they redirect permanently rather than 404.
    return [
      { source: '/academy', destination: '/training', permanent: true },
      { source: '/academic', destination: '/university', permanent: true },
    ];
  },
};

export default nextConfig;
