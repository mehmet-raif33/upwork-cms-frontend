import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SERVER_API: process.env.SERVER_API,
    NEXT_PUBLIC_SERVER_API1: process.env.SERVER_API1,
    NEXT_PUBLIC_FRONTEND_URL: process.env.FRONTEND_URL,
  },
  
  // Vercel deployment optimizasyonları
  experimental: {
    // Turbopack kullanımı (development için)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for auth
  async redirects() {
    return [
      {
        source: '/auth/callback',
        destination: '/auth/callback',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
