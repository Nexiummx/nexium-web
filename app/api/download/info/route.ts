import { NextRequest, NextResponse } from "next/server";
import {
  getVideoInfo,
  parseVideoUrl,
  YtDlpMissingError,
} from "@/lib/downloader/ytdlp";
import type { DownloadRequest, DownloadResponse } from "@/lib/downloader/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Devuelve título, miniatura, duración y resoluciones disponibles de una URL */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let url: string;
  try {
    const body = (await request.json()) as DownloadRequest;
    url = parseVideoUrl(body.url);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "URL inválida",
      } satisfies DownloadResponse,
      { status: 400 }
    );
  }

  try {
    const info = await getVideoInfo(url);
    return NextResponse.json({ success: true, info } satisfies DownloadResponse);
  } catch (error) {
    console.error("[download-info] Error:", error);
    const missing = error instanceof YtDlpMissingError;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: missing ? "YTDLP_MISSING" : undefined,
      } satisfies DownloadResponse,
      { status: missing ? 501 : 422 }
    );
  }
}
