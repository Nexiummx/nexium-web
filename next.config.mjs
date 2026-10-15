/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Star Moda: HTML autocontenido en public/starmoda (herramienta interna)
  async rewrites() {
    return [{ source: "/starmoda", destination: "/starmoda/index.html" }];
  },
  async headers() {
    return [
      {
        source: "/starmoda/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/starmoda",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
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
