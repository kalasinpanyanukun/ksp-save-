import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ksp: {
          navy: "#0D2B45",
          blue: "#2077C7",
          accent: "#4DB6E6",
          gray: "#707ABA",
          bg: "#F2F6FA",
        },
        "ksp-blue": {
          50: "#EAF3FF",
          100: "#D2E5FB",
          200: "#A5CCF7",
          300: "#78B2F2",
          400: "#4B98EC",
          500: "#2077C7",
          600: "#1A5FA0",
          700: "#144878",
          800: "#0D2B45",
          900: "#081A2B",
        },
      },
      fontFamily: {
        sans: ['"Prompt"', "system-ui", "Sarabun", "sans-serif"],
        display: ['"Prompt"', "system-ui", "Sarabun", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(13, 43, 69, 0.06), 0 4px 16px rgba(13, 43, 69, 0.06)",
        focus: "0 0 0 3px rgba(32, 119, 199, 0.25)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
