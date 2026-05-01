// Logo horizontal (ícono + wordmark "NEXIUM") — para header
export function LogoHorizontal({ height = 34 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 130 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nexium"
    >
      <polygon
        points="15,2 27,9 27,23 15,30 3,23 3,9"
        fill="rgba(27,47,110,.15)"
        stroke="#1B2F6E"
        strokeWidth="1.8"
      />
      <circle cx="15" cy="16" r="3.5" fill="#1B2F6E" />
      <line x1="15" y1="2" x2="15" y2="9.5" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="27" y1="9" x2="21" y2="13" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="27" y1="23" x2="21" y2="19" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="15" y1="30" x2="15" y2="22.5" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="3" y1="23" x2="9" y2="19" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <line x1="3" y1="9" x2="9" y2="13" stroke="#8A9BB0" strokeWidth="1.2" opacity=".7" />
      <text
        x="38"
        y="23"
        fontFamily="'Barlow Condensed', sans-serif"
        fontWeight="700"
        fontSize="20"
        fill="#FFFFFF"
        letterSpacing="3"
      >
        NEXIUM
      </text>
    </svg>
  );
}
