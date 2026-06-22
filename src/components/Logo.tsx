import { useState } from "react";

interface Props {
  className?: string;
}

// Reihenfolge der Datei-Kandidaten aus dem public-Ordner.
// Sobald eine dieser Dateien existiert, wird sie automatisch verwendet.
const KANDIDATEN = [
  `${import.meta.env.BASE_URL}logo.svg`,
  `${import.meta.env.BASE_URL}logo.png`,
];

/**
 * dental-bauer-Logo.
 * Nutzt die echte Datei aus public/ (logo.svg oder logo.png), falls vorhanden.
 * Andernfalls Fallback: SVG-Nachbau (navy Kasten, Wortmarke + Zahn).
 */
export function Logo({ className = "h-10" }: Props) {
  const [idx, setIdx] = useState(0);

  if (idx < KANDIDATEN.length) {
    return (
      <img
        src={KANDIDATEN[idx]}
        alt="dental bauer"
        className={`${className} w-auto object-contain`}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }

  // Fallback-Nachbau
  return (
    <svg
      className={className}
      viewBox="0 0 200 100"
      role="img"
      aria-label="dental bauer"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="94" height="100" rx="12" fill="#003869" />
      <rect x="106" y="0" width="94" height="100" rx="12" fill="#003869" />
      <text
        x="16"
        y="50"
        fill="#fff"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        letterSpacing="-1"
      >
        dental
      </text>
      <text
        x="16"
        y="80"
        fill="#fff"
        fontSize="26"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        letterSpacing="-1"
      >
        bauer
      </text>
      <path
        transform="translate(118 8) scale(0.62)"
        fill="#fff"
        d="M16 30 C16 16 32 6 52 12 C72 18 88 12 86 30 C85 42 80 50 78 56 C76 70 74 92 66 108 C62 115 58 110 56 100 C54 86 52 70 50 70 C48 70 46 86 44 100 C42 110 38 115 34 108 C26 92 22 70 20 56 C18 50 15 42 16 30 Z"
      />
    </svg>
  );
}
