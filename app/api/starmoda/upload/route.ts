import { NextRequest, NextResponse } from "next/server";
import { createUploadTicket, StarmodaError, type UploadRequest } from "@/lib/starmoda/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Valida el código de acceso y regresa una URL firmada para subir una foto */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }
  try {
    const ticket = await createUploadTicket(body);
    return NextResponse.json(ticket);
  } catch (error) {
    if (error instanceof StarmodaError) {
      if (error.status >= 500) console.error("[starmoda-upload]", error.message);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[starmoda-upload] Error:", error);
    return NextResponse.json({ error: "error_interno" }, { status: 500 });
  }
}
