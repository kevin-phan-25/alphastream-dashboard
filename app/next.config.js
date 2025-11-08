/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // This value is only used server-side – safe to commit
    WEBHOOK_SECRET: "alphastream-bot-secure-2025!x7k9",
  },
};

module.exports = nextConfig;
