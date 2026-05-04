/**
 * Solo importar desde Server Components (layout, schema).
 * Lee el número en tiempo de ejecución en el servidor — en Vercel basta con
 * definir WA_NUMBER o NEXT_PUBLIC_WA_NUMBER y redeployar.
 */

import { buildWaLinks, type WaLinks } from "./wa-links";

const DEFAULT_WA = "MX_WA_REDACTED";

/** Deja solo dígitos (acepta +52, espacios, guiones). */
export function normalizeWaDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function getWaNumberFromEnv(): string {
  const raw =
    process.env.WA_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WA_NUMBER?.trim() ||
    "";
  const digits = normalizeWaDigits(raw);
  if (digits.length >= 10) return digits;
  return DEFAULT_WA;
}

export function getSiteWaConfig(): { waNumber: string; waLinks: WaLinks } {
  const waNumber = getWaNumberFromEnv();
  return { waNumber, waLinks: buildWaLinks(waNumber) };
}
