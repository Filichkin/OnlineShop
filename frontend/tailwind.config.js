/** @type {import('tailwindcss').Config} */

import typography from "@tailwindcss/typography"
import textShadow from "tailwindcss-textshadow"

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '3rem',
        lg: '3rem',
        xl: '4rem',
        '2xl': '5rem',
      },
      screens: {
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '100%',
      },
    },
    extend: {
      backgroundImage: {
        "custom-gradient": "linear-gradient(to right, #ff7e5f, #feb47b)",
      },
      colors: {
        primary: "#3B92F6",
        secondary: "#feb47b",
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
      },
      fontWeight: {
        300: '300',
        400: '400',
        450: '450',
        500: '500',
        550: '550',
        600: '600',
        700: '700',
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" }
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [
    typography,
    textShadow
  ],
};

