/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // THIS FIXES 404 ON VERCEL
  output: 'standalone',
  // FORCE DYNAMIC API ROUTES
  experimental: {
    serverActions: false,
  },
};

module.exports = nextConfig;
