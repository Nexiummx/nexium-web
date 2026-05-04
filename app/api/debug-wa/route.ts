import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint temporal de diagnóstico.
 * Visita: https://nexiummx.com/api/debug-wa
 * Muestra qué lee el servidor en tiempo real (sin exponer el número completo).
 * ELIMINAR después de confirmar que WA_NUMBER está bien.
 */
export async function GET() {
  const waRaw = process.env.WA_NUMBER ?? "";
  const waPublic = process.env.NEXT_PUBLIC_WA_NUMBER ?? "";

  const mask = (v: string) =>
    v.length >= 6 ? v.slice(0, 4) + "••••" + v.slice(-2) : v.length > 0 ? "•••" : "(vacío)";

  return NextResponse.json({
    WA_NUMBER: {
      set: waRaw.length > 0,
      length: waRaw.length,
      preview: mask(waRaw),
    },
    NEXT_PUBLIC_WA_NUMBER: {
      set: waPublic.length > 0,
      length: waPublic.length,
      preview: mask(waPublic),
    },
    resolved: (() => {
      const raw = waRaw || waPublic;
      const digits = raw.replace(/\D/g, "");
      return {
        digits_length: digits.length,
        preview: mask(digits),
        valid: digits.length >= 10,
      };
    })(),
  });
}
