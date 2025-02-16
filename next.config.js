/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
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
    ]
  },
  images: {
    unoptimized: true,
  },
  // Copy static files to standalone output
  outputFileTracing: true,
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
};

module.exports = nextConfig; 