// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  env: {
    WEBHOOK_SECRET: "alphastream-bot-secure-2025!x7k9",
  },
};

module.exports = nextConfig;
