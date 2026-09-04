/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build-Zeitpunkt (für sichtbaren Versionsstempel in der Fußzeile).
const buildZeit = new Date().toLocaleString("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "short",
  timeStyle: "short",
});

// Für GitHub Pages unter https://<user>.github.io/kampagnenplanung/
// muss "base" dem Repository-Namen entsprechen.
export default defineConfig({
  plugins: [react()],
  base: "/kampagnenplanung/",
  define: {
    __BUILD_TIME__: JSON.stringify(buildZeit),
  },
  // Tests laufen mit `npm test` (einmalig) bzw. `npm run test:watch`.
  // Getestet wird die reine Logik (Filter, Datum, Namen) – ohne Browser/DOM.
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
