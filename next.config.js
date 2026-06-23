/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features (safe)
  experimental: {
    serverActions: true,
  },

  // Optional: Better logging in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
