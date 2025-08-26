/** @type {import('tailwindcss').Config} */
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
    },
  },
  plugins: [],
};

