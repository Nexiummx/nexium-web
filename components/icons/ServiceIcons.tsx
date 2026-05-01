const HEX = "28,4 50,16 50,40 28,52 6,40 6,16";

export function IcoWeb({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      width="56"
      height="56"
    >
      <polygon points={HEX} fill="rgba(27,47,110,.12)" stroke="#1B2F6E" strokeWidth="1.5" />
      <path
        d="M20 28h16M24 22l-6 6 6 6M32 22l6 6-6 6"
        stroke="#8A9BB0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IcoCons({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      width="56"
      height="56"
    >
      <polygon points={HEX} fill="rgba(27,47,110,.12)" stroke="#1B2F6E" strokeWidth="1.5" />
      <circle cx="20" cy="22" r="4" stroke="#8A9BB0" strokeWidth="1.5" fill="none" />
      <circle cx="36" cy="22" r="4" stroke="#8A9BB0" strokeWidth="1.5" fill="none" />
      <circle cx="28" cy="35" r="4" stroke="#8A9BB0" strokeWidth="1.5" fill="none" />
      <line x1="24" y1="22" x2="32" y2="22" stroke="#8A9BB0" strokeWidth="1.2" opacity=".6" />
      <line x1="21" y1="26" x2="27" y2="31" stroke="#8A9BB0" strokeWidth="1.2" opacity=".6" />
      <line x1="35" y1="26" x2="29" y2="31" stroke="#8A9BB0" strokeWidth="1.2" opacity=".6" />
    </svg>
  );
}

export function IcoSaas({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      width="56"
      height="56"
    >
      <polygon points={HEX} fill="rgba(27,47,110,.12)" stroke="#1B2F6E" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="8" stroke="#8A9BB0" strokeWidth="1.5" fill="none" />
      <circle cx="28" cy="28" r="3" fill="#1B2F6E" />
      <path
        d="M28 16v4M28 36v4M16 28h4M36 28h4"
        stroke="#8A9BB0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19.5 19.5l2.8 2.8M33.7 33.7l2.8 2.8M19.5 36.5l2.8-2.8M33.7 22.3l2.8-2.8"
        stroke="#8A9BB0"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity=".6"
      />
    </svg>
  );
}
