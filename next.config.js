/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // FORCE API ROUTES TO WORK
  experimental: {
    appDocumentPreloading: false,
  },
};

module.exports = nextConfig;
