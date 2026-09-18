/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f1f8f4",
          100: "#dcefe2",
          200: "#b8dfc7",
          300: "#8ecba6",
          400: "#5fae80",
          500: "#3f9264",
          600: "#2f7550",
          700: "#265d41",
          800: "#204a35",
          900: "#1b3d2c",
        },
        canopy: {
          900: "#0f2417",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
