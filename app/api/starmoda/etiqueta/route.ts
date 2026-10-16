import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { parseImage, readTag } from "@/lib/starmoda/etiqueta";
import { StarmodaError, validateAccessCode } from "@/lib/starmoda/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Lee estilo, color, talla y código de barras de la foto de una etiqueta */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(process.env.ANTHROPIC_API_KEY || "").trim()) {
    return NextResponse.json({ error: "lectura_no_configurada" }, { status: 501 });
  }
  let body: { code?: unknown; image?: unknown };
  try {
    body = (await request.json()) as { code?: unknown; image?: unknown };
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }
  try {
    const image = parseImage(body.image);
    await validateAccessCode(body.code);
    return NextResponse.json(await readTag(image));
  } catch (error) {
    if (error instanceof StarmodaError) {
      if (error.status >= 500) console.error("[starmoda-etiqueta]", error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "ia_ocupada" }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[starmoda-etiqueta] ANTHROPIC_API_KEY inválida");
      return NextResponse.json({ error: "ia_llave_invalida" }, { status: 502 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[starmoda-etiqueta] API", error.status, error.message);
      return NextResponse.json({ error: "ia_error" }, { status: 502 });
    }
    console.error("[starmoda-etiqueta] Error:", error);
    return NextResponse.json({ error: "error_interno" }, { status: 500 });
  }
}
