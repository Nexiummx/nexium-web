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
 * Devuelve string vacío si la variable no está configurada (la app no se rompe).
 */
export function getWaNumberFromEnv(): string {
  const raw =
    process.env.WA_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WA_NUMBER?.trim() ||
    "";
  const digits = normalizeWaDigits(raw);
  if (digits.length >= 10) return digits;
  // Variable no configurada: devuelve vacío y los componentes ocultarán el botón de WA.
  return "";
}

export function getSiteWaConfig(): { waNumber: string; waLinks: WaLinks | null } {
  const waNumber = getWaNumberFromEnv();
  if (!waNumber) return { waNumber: "", waLinks: null };
  return { waNumber, waLinks: buildWaLinks(waNumber) };
}
