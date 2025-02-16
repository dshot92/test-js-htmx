/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=(), interest-cohort=(), join-ad-interest-group=(), attribution-reporting=(), run-ad-auction=(), private-state-token-issuance=(), private-state-token-redemption=()'
          }
        ],
      },
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/thumbnails/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=31536000',
          },
        ],
      },
    ]
  },
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => 'build',
  poweredByHeader: false,
  compress: true,
  // Copy static files to standalone output
  outputFileTracing: true,
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

module.exports = nextConfig; 