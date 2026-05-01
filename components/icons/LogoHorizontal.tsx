// Logo horizontal oficial (ícono + wordmark) — assets en /public/brand
const HORIZONTAL = {
  dark: "/brand/nexium-logo-horizontal-dark.svg",
  light: "/brand/nexium-logo-horizontal-light.svg",
} as const;

type Variant = keyof typeof HORIZONTAL;

/** viewBox 2700×1000 */
const ASPECT = 2700 / 1000;

export function LogoHorizontal({
  height = 34,
  variant = "dark",
}: {
  height?: number;
  variant?: Variant;
}) {
  const width = Math.round(height * ASPECT);
  return (
    <img
      src={HORIZONTAL[variant]}
      alt="Nexium"
      width={width}
      height={height}
      decoding="async"
      style={{ display: "block", height, width: "auto", maxWidth: "100%" }}
    />
  );
}
