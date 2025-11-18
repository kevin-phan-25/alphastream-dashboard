/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    customKey: 'my-value',
  },
  images: {
    domains: ['example.com'],
  },
};

module.exports = nextConfig;
