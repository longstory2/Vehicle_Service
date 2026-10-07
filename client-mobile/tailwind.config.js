/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#F5F8FF",
          200: "#EBF4FF",
          300: "#C3D9FF",
          400: "#9BBFFF",
          500: "#0286FF",
          600: "#6A85E6",
          700: "#475A99",
          800: "#364573",
          900: "#242B4D",
        },
        secondary: {
          100: "#F8F8F8",
          200: "#F1F1F1",
          300: "#D9D9D9",
          400: "#C2C2C2",
          500: "#AAAAAA",
          600: "#999999",
          700: "#666666",
          800: "#4D4D4D",
          900: "#333333",
        },
      },
      fontFamily: {
        jakarta: ["Jakarta", "sans-serif"],
        "jakarta-bold": ["Jakarta-Bold", "sans-serif"],
        "jakarta-semi": ["Jakarta-SemiBold", "sans-serif"],
      },
    },
  },
};