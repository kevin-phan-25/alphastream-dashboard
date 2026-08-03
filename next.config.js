/** @type {import('next').NextConfig} */

const nextConfig = {

  reactStrictMode: true,


  // Image optimization
  images: {

    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],

  },


  // Development logging
  logging: {

    fetches: {
      fullUrl: true,
    },

  },

};


module.exports = nextConfig;
