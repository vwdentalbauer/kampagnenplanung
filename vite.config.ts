import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Für GitHub Pages unter https://<user>.github.io/kampagnenplanung/
// muss "base" dem Repository-Namen entsprechen.
export default defineConfig({
  plugins: [react()],
  base: "/kampagnenplanung/",
});
