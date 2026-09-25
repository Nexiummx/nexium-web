import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { Readable } from "stream";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import {
  downloadVideo,
  parseVideoUrl,
  YtDlpMissingError,
} from "@/lib/downloader/ytdlp";
import {
  DOWNLOAD_QUALITIES,
  type DownloadQuality,
  type DownloadRequest,
  type DownloadResponse,
} from "@/lib/downloader/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function POST(request: NextRequest): Promise<NextResponse> {
  let url: string;
  let quality: DownloadQuality;
  try {
    const body = (await request.json()) as DownloadRequest;
    url = parseVideoUrl(body.url);
    quality = DOWNLOAD_QUALITIES.includes(body.quality as DownloadQuality)
      ? (body.quality as DownloadQuality)
      : "best";
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "URL inválida",
      } satisfies DownloadResponse,
      { status: 400 }
    );
  }

  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), "nexium-dl-"));
  const cleanup = () =>
    fsp.rm(workDir, { recursive: true, force: true }).catch((err) =>
      console.warn("[download-video] Cleanup failed:", err)
    );

  try {
    console.log(`[download-video] ${quality} · ${url}`);
    const result = await downloadVideo({
      url,
      quality,
      outputDir: workDir,
      ffmpegPath: ffmpegInstaller.path,
    });

    // En Vercel (con token configurado): subir a Blob y devolver JSON con URL
    if (USE_BLOB) {
      const { put } = await import("@vercel/blob");
      const blob = await put(
        `downloads/${result.filename}`,
        fs.createReadStream(result.filePath),
        { access: "public", contentType: result.contentType, addRandomSuffix: true }
      );
      await cleanup();
      return NextResponse.json({
        success: true,
        fileUrl: blob.url,
        filename: result.filename,
      } satisfies DownloadResponse);
    }

    // En local: devolver el archivo en streaming y limpiar al terminar
    const { size } = await fsp.stat(result.filePath);
    const stream = fs.createReadStream(result.filePath);
    stream.on("close", cleanup);

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(size),
        "X-Nexium-Filename": result.filename,
      },
    });
  } catch (error) {
    await cleanup();
    console.error("[download-video] Error:", error);
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
