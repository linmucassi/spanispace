import type { NextConfig } from "next";

// A conservative Content-Security-Policy.
//
// It deliberately sets NO default-src and NO script-src. Next's App Router
// injects inline bootstrap scripts for hydration and streaming, and a
// default-src would become their fallback and blank the page. Locking scripts
// down properly needs a per-request nonce, which is a separate change that
// should ship report-only first.
//
// What is set here are the directives that carry real protection and zero risk
// to a Next app, because none of them fall back to govern scripts:
//   connect-src      every network call the app makes: itself, Supabase over
//                    https and wss, Resend, and Google's Identity Services
//                    (the "Continue with Google" button on login/register --
//                    accounts.google.com issues the ID token client-side).
//                    An injected exfil-to-evil.com fetch is refused.
//   img-src          self, data URIs, blob URIs (client-side canvas resizing
//                    reads the picked file via URL.createObjectURL before
//                    upload -- AvatarUpload.tsx), the Supabase project
//                    (avatars/CVs are served straight from Storage, no
//                    next/image proxy in front of them), and the two image
//                    hosts next/image trusts
//   frame-ancestors  nobody can iframe the site, the header twin of XFO
//   base-uri/object  shut off two classic injection vectors
//   form-action      a form may only post to us and to Netlify Forms
const csp = [
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://accounts.google.com",
  "img-src 'self' data: blob: https://*.supabase.co https://upload.wikimedia.org https://picsum.photos",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

// Baseline security headers, applied to every route including SSR and edge,
// which a static Netlify [[headers]] block does not cover.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
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
