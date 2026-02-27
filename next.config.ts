import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy API calls to existing backend during development
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*', // NextAuth handles these
      },
      {
        source: '/api/chat/:path*',
        destination: '/api/chat/:path*', // Our API routes handle these
      },
      {
        source: '/api/queue/:path*',
        destination: '/api/queue/:path*',
      },
      {
        source: '/api/stripe/:path*',
        destination: '/api/stripe/:path*',
      },
      {
        // Everything else proxies to the existing backend
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
