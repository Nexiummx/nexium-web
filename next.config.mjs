/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-core",
      "@sparticuz/chromium-min",
      "@sparticuz/chromium",
      "puppeteer",
      "@ffmpeg-installer/ffmpeg",
      "fluent-ffmpeg",
    ],
  },
};

export default nextConfig;
