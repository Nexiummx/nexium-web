import { NextRequest, NextResponse } from "next/server";
import { checkSetup } from "@/lib/starmoda/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnóstico de la subida de fotos para la pantalla de conexión */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let code: unknown;
  try {
    code = ((await request.json()) as { code?: unknown }).code;
  } catch {
    code = undefined;
  }
  return NextResponse.json(await checkSetup(code));
}
