/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // bin/yt-dlp no se importa desde el código: hay que incluirlo a mano
    // en el bundle de las funciones de descarga (npm run setup:downloader)
    outputFileTracingIncludes: {
      "/api/download/**": ["./bin/**"],
    },
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
