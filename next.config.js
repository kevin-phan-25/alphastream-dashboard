/**
 * ---------------------------------------------------------
 * Date: 2026-08-03
 * File: next.config.js
 *
 * Changes:
 * - Removed deprecated serverActions flag
 * - Kept image optimization
 * - Added Cloudflare compatible configuration
 * ---------------------------------------------------------
 */


/** @type {import('next').NextConfig} */

const nextConfig = {


  reactStrictMode:true,


  swcMinify:true,


  images: {

    remotePatterns:[

      {
        protocol:"https",
        hostname:"**",
      },

    ],

  },


};


module.exports = nextConfig;
