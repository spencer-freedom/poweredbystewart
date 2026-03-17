import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        stewart: {
          bg: "#0f1117",
          card: "#1a1d27",
          border: "#2a2d3a",
          accent: "#3b82f6",
          text: "#e2e8f0",
          muted: "#94a3b8",
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
