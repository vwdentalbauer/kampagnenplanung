interface Props {
  className?: string;
}

/**
 * dental-bauer-Logo als SVG nachgebaut (navy Kasten, Wortmarke + Zahn).
 * Hinweis: Falls die offizielle Logo-Datei vorliegt, kann sie hier 1:1
 * ersetzt werden.
 */
export function Logo({ className = "h-10" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 48"
      role="img"
      aria-label="dental bauer"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="96" height="48" rx="5" fill="#003869" />
      <line x1="59" y1="7" x2="59" y2="41" stroke="#fff" strokeWidth="1.4" />
      <text
        x="9"
        y="23"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        dental
      </text>
      <text
        x="9"
        y="38"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        bauer
      </text>
      <path
        transform="translate(66 8) scale(0.55)"
        fill="#fff"
        d="M24 1 C12 1 4 7 4 19 C4 28 7 37 10 45 C11 49 16 50 18 45 L21 35 C22 32 26 32 27 35 L30 45 C32 50 37 49 38 45 C41 37 44 28 44 19 C44 7 36 1 24 1 Z"
      />
    </svg>
  );
}
