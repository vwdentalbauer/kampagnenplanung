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
      {/* Zahn rechts: gewölbte Krone, zwei Wurzeln mit mittlerer Spitze */}
      <path
        transform="translate(60 9) scale(0.62)"
        fill="#fff"
        d="M11 12 C18 5 31 5 38 13 C42 17 42 24 40 30 C39 36 37 43 35 48 C34 51 31 51 30 47 C28 41 26 35 24 34 C22 35 20 41 18 47 C17 51 14 51 13 48 C11 43 9 36 8 30 C6 24 6 17 11 12 Z"
      />
    </svg>
  );
}
