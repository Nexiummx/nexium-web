export function NexiumMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M4 6h10l-10 20H4V6Z" fill="currentColor" opacity="0.95" />
      <path d="M18 6h10v8H18V6Z" fill="currentColor" opacity="0.55" />
      <path d="M18 16h10L14 28v-8h4l8-4H18Z" fill="currentColor" />
    </svg>
  );
}
