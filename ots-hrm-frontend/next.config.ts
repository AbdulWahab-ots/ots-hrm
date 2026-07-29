import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
   domains: ['hrmbucket.blob.core.windows.net'],
    // OR for more specific control (Next.js 13+ recommended):
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
    ],
  },
  // ... other config options
};

export default nextConfig;
