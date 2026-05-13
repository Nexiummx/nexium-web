export const MOTION_JSON_VERSION = 0 as const;

/** Parche por tween GSAP (id estable g_0, g_1, … orden getChildren). */
export type GsapTweenPatchV0 = {
  id: string;
  duration?: number;
  delay?: number;
  ease?: string;
};

/** Parche por animación CSS detectada (data-nx-css en el DOM). */
export type CssAnimPatchV0 = {
  id: string;
  animationDuration?: string;
  animationDelay?: string;
};

/** Lo que se inyecta en el iframe / Puppeteer (sin huella). */
export type MotionApplyPayload = {
  gsap: GsapTweenPatchV0[];
  css: CssAnimPatchV0[];
};

/** Documento guardado en localStorage o enviado al export. */
export type MotionOverridesV0 = {
  version: typeof MOTION_JSON_VERSION;
  /** Huella del HTML al guardar; avisa si deja de coincidir. */
  htmlFingerprint: string;
  /**
   * Multiplicador de duración por `sceneId` del catálogo (#scene-cta, sin-escena, …).
   * Se aplica sobre la duración intrínseca de cada fila: (parche o dur. del catálogo) × factor.
   * En iframe/export se envían ya los `gsap` efectivos (fusionados).
   */
  gsapSceneDurationScale?: Record<string, number>;
} & MotionApplyPayload;

export type MotionCatalogGsapRow = {
  id: string;
  label: string;
  /** Ancestro #scene-* del primer target, o "sin-escena". */
  sceneId: string;
  /** Inicio en la timeline raíz (s). */
  startSec: number;
  /** Duración del tween (s). */
  duration: number;
  /** delay() GSAP (s), informativo. */
  delay: number;
  ease: string;
  /** startSec + duration (puede ser ≈ start si es instantáneo). */
  endSec: number;
};

export type MotionCatalogCssRow = {
  id: string;
  label: string;
  animationName: string;
  duration: string;
  delay: string;
  /** Inicio aproximado desde animation-delay (s). */
  startSec: number;
  /** Fin aproximado start + duration (s). */
  endSec: number;
};

export type MotionCatalogPayload = {
  gsap: MotionCatalogGsapRow[];
  css: MotionCatalogCssRow[];
};

export function emptyMotionOverrides(htmlFingerprint: string): MotionOverridesV0 {
  return {
    version: MOTION_JSON_VERSION,
    htmlFingerprint,
    gsap: [],
    css: [],
  };
}

export function isMotionOverridesV0(v: unknown): v is MotionOverridesV0 {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.version === MOTION_JSON_VERSION &&
    typeof o.htmlFingerprint === "string" &&
    Array.isArray(o.gsap) &&
    Array.isArray(o.css)
  );
}
