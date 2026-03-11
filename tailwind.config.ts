import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#39FF14",
        "accent-2": "#b8f752",
        surface: "#111111",
        bg: "#0a0a0a",
        muted: "#6b7280",
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(57,255,20,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(57,255,20,0.7)" },
        },
        "laser-x": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100vw)" },
        },
        "laser-y": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "text-reveal": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0% 0 0)" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ticker-scroll-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "particle-drift": {
          "0%": { transform: "translateY(100vh) translateX(0px)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(-20px) translateX(30px)", opacity: "0" },
        },
        "beam-expand": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0.8" },
          "100%": { transform: "scale(3) rotate(45deg)", opacity: "0" },
        },
        "scale-x-in": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "scale-y-in": {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "ticker-scroll": "ticker-scroll 30s linear infinite",
        "ticker-scroll-reverse": "ticker-scroll-reverse 30s linear infinite",
        "ticker-scroll-fast": "ticker-scroll 20s linear infinite",
        "beam-expand": "beam-expand 3s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
