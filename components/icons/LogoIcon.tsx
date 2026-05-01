// Ícono hexagonal de Nexium (sin wordmark) — para footer y favicon
export function LogoIcon({ height = 32 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon
        points="17,2 30,9.5 30,24.5 17,32 4,24.5 4,9.5"
        fill="rgba(27,47,110,.15)"
        stroke="#1B2F6E"
        strokeWidth="1.8"
      />
      <circle cx="17" cy="17" r="3.5" fill="#1B2F6E" />
      <line x1="17" y1="2" x2="17" y2="10" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="30" y1="9.5" x2="24" y2="13" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="30" y1="24.5" x2="24" y2="21" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="17" y1="32" x2="17" y2="24" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="4" y1="24.5" x2="10" y2="21" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="4" y1="9.5" x2="10" y2="13" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
    </svg>
  );
}
