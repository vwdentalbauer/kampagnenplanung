/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Akzentfarbe orientiert an der Excel-Markierung (db-Grün)
        marke: {
          DEFAULT: "#71C2AD",
          dark: "#4f9d88",
        },
      },
    },
  },
  plugins: [],
};
