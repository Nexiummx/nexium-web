/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min", "puppeteer"],
  },
};

export default nextConfig;
