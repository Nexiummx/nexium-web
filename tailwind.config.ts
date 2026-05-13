import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nex: {
          bg: "#0D0D0D",
          surface: "#141414",
          surfaceAlt: "#1A1A1A",
          surfaceLight: "#F5F4F0",
          border: "#2A2A2A",
          text: "#F5F4F0",
          secondary: "#9A9A9A",
          muted: "#5A5A5A",
          onLight: "#0D0D0D",
          blue: "#1B2F6E",
          blueGlow: "#2D4FA8",
          blueSoft: "rgba(27, 47, 110, 0.12)",
          warm: "#E8D5B7",
          highlight: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-instrument)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        nex: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "marquee-slow": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.28" },
          "50%": { opacity: "0.48" },
        },
      },
      animation: {
        marquee: "marquee-slow 45s linear infinite",
        "marquee-mobile": "marquee-slow 60s linear infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
      },
      backgroundImage: {
        "grid-hero":
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid80: "80px 80px",
      },
    },
  },
  plugins: [],
};

export default config;
