import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
