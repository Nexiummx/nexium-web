/**
 * Solo importar desde Server Components (layout, schema).
 * Lee el número en tiempo de ejecución en el servidor — en Vercel basta con
 * definir WA_NUMBER o NEXT_PUBLIC_WA_NUMBER y redeployar.
 */

import { buildWaLinks, type WaLinks } from "./wa-links";

/** Deja solo dígitos (acepta +52, espacios, guiones). */
export function normalizeWaDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Número solo desde variables de entorno (nunca hardcodeado en el repo).
 * En local: copia `.env.example` → `.env.local` y define `WA_NUMBER`.
 */
export function getWaNumberFromEnv(): string {
  const raw =
    process.env.WA_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WA_NUMBER?.trim() ||
    "";
  const digits = normalizeWaDigits(raw);
  if (digits.length >= 10) return digits;

  throw new Error(
    "Falta WA_NUMBER o NEXT_PUBLIC_WA_NUMBER (mínimo 10 dígitos, solo números). " +
      "Copia .env.example a .env.local y rellena WA_NUMBER, o configura la variable en Vercel."
  );
}

export function getSiteWaConfig(): { waNumber: string; waLinks: WaLinks } {
  const waNumber = getWaNumberFromEnv();
  return { waNumber, waLinks: buildWaLinks(waNumber) };
}
