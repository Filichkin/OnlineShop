/** @type {import('tailwindcss').Config} */

import typography from "@tailwindcss/typography"
import textShadow from "tailwindcss-textshadow"

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "custom-gradient": "linear-gradient(to right, #ff7e5f, #feb47b)",
      },
      colors: {
        primary: "#3B92F6",
        secondary: "#feb47b",
      },
      fontFamily: {
        poppins: "poppins, sans-serif",
      },
      keyframes: {
      wiggle: {
        "0%, 100%": { transform: "rotate(-3deg)" },
        "50%": { transform: "rotate(3deg)" }
        },
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
      },
    },
  },
  plugins: [
    typography,
    textShadow
  ],
};

