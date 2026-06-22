/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // dental bauer CI
        marke: {
          DEFAULT: "#003869", // DentalGuard Blue (Primär)
          dark: "#002a4f",
          light: "#2DABE3", // Prophy Mint
        },
        ci: {
          pink: "#E72F89", // Spark Pink
          mint: "#2DABE3", // Prophy Mint
          green: "#B1D9CF", // Hygienic Green
          air: "#B0DFF9", // Clinical Air
          human: "#FDEFA8", // Human Tone
          lavender: "#B4B1D9", // Calm Lavender
        },
      },
    },
  },
  plugins: [],
};
