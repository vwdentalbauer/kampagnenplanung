interface Props {
  className?: string;
}

/**
 * dental-bauer-Logo als SVG nachgebaut (navy Kasten, Wortmarke + Zahn).
 * Seitenverhältnis 2:1 (mit w-auto verzerrungsfrei).
 * Hinweis: Sobald die offizielle Logo-Datei vorliegt, hier 1:1 ersetzen.
 */
export function Logo({ className = "h-10" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 50"
      role="img"
      aria-label="dental bauer"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="50" rx="5" fill="#003869" />
      {/* Mittiger Trenner */}
      <line x1="50" y1="8" x2="50" y2="42" stroke="#fff" strokeWidth="1.3" />
      {/* Wortmarke links */}
      <text
        x="9"
        y="24"
        fill="#fff"
        fontSize="13.5"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        letterSpacing="-0.6"
      >
        dental
      </text>
      <text
        x="9"
        y="39"
        fill="#fff"
        fontSize="13.5"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
        letterSpacing="-0.6"
      >
        bauer
      </text>
      {/* Zahn rechts (zwei obere Höcker mit Kerbe, runder Körper) */}
      <path
        transform="translate(60 9) scale(0.62)"
        fill="#fff"
        d="M8 6 C14 2 20 4 24 9 C28 4 34 2 40 6 C46 12 44 28 40 40 C37 49 31 52 27 47 C25 44 23 44 21 47 C17 52 11 49 8 40 C4 28 2 12 8 6 Z"
      />
    </svg>
  );
}
