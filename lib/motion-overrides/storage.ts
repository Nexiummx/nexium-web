import { fingerprintHtml } from "./fingerprint";
import { isMotionOverridesV0, type MotionOverridesV0 } from "./types";

const STORAGE_KEY = "nexium-motion-overrides-v0";

export function loadMotionOverridesFromStorage(): MotionOverridesV0 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isMotionOverridesV0(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveMotionOverridesToStorage(data: MotionOverridesV0): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Carga si la huella coincide con el HTML actual; si no, null. */
export function loadMotionOverridesIfMatch(html: string): MotionOverridesV0 | null {
  const fp = fingerprintHtml(html);
  const saved = loadMotionOverridesFromStorage();
  if (saved && saved.htmlFingerprint === fp) return saved;
  return null;
}
