/**
 * ---------------------------------------------------------
 * Date: 2026-08-15
 * File: next.config.js
 *
 * Changes:
 * - Removed deprecated serverActions flag
 * - Removed swcMinify (invalid / no-op on Next 15; caused build warning)
 * - Kept image optimization + Cloudflare-compatible config
 * ---------------------------------------------------------
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
