// Ícono hexagonal oficial — assets en /public/brand
const ICON = {
  dark: "/brand/nexium-icon-dark.svg",
  light: "/brand/nexium-icon-light.svg",
} as const;

type Variant = keyof typeof ICON;

export function LogoIcon({
  height = 32,
  variant = "dark",
}: {
  height?: number;
  variant?: Variant;
}) {
  return (
    <img
      src={ICON[variant]}
      alt=""
      width={height}
      height={height}
      decoding="async"
      aria-hidden
      style={{ display: "block", height, width: height }}
    />
  );
}
