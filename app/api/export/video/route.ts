import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { captureFrames } from "@/lib/video/captureFrames";
import { encodeVideo } from "@/lib/video/encodeVideo";
import {
  extractRawMetadata,
  resolveVideoConfig,
} from "@/lib/video/extractMetadata";
import { validateConfig } from "@/lib/video/presets";
import type { VideoExportRequest, VideoExportResponse } from "@/lib/video/types";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let workDir: string | null = null;

  try {
    const body = (await request.json()) as VideoExportRequest;

    if (!body.html || typeof body.html !== "string") {
      return NextResponse.json(
        { success: false, error: "html field is required and must be a string" },
        { status: 400 }
      );
    }

    const rawMetadata = extractRawMetadata(body.html);
    const config = resolveVideoConfig(body, rawMetadata);

    const validation = validateConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, config },
        { status: 400 }
      );
    }

    console.log("[video-export] Config resuelta:", config);

    workDir = await fs.mkdtemp(path.join(os.tmpdir(), "nexium-video-"));
    const framesDir = path.join(workDir, "frames");
    const outputPath = path.join(workDir, `${config.filename}.mp4`);

    console.log(
      `[video-export] Capturing: ${config.durationSeconds}s @ ${config.fps}fps (${config.width}×${config.height})`
    );

    const frames = await captureFrames({
      html: body.html,
      durationSeconds: config.durationSeconds,
      fps: config.fps,
      width: config.width,
      height: config.height,
      outputDir: framesDir,
      motionApply: body.motionApply,
    });

    console.log(`[video-export] Encoding ${frames.length} frames to MP4`);
    await encodeVideo({
      framesDir,
      outputPath,
      fps: config.fps,
      width: config.width,
      height: config.height,
    });

    const videoBuffer = await fs.readFile(outputPath);
    const durationMs = Date.now() - startTime;
    const filename = `${config.filename}.mp4`;

    console.log(
      `[video-export] Done in ${(durationMs / 1000).toFixed(1)}s · USE_BLOB=${USE_BLOB}`
    );

    // En Vercel (con token configurado): subir a Blob y devolver JSON con URL
    if (USE_BLOB) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`videos/${filename}`, videoBuffer, {
        access: "public",
        contentType: "video/mp4",
      });

      return NextResponse.json({
        success: true,
        videoUrl: blob.url,
        filename,
        durationMs,
        framesCaptured: frames.length,
        config,
      } satisfies VideoExportResponse);
    }

    // En local (sin token): devolver el MP4 como descarga directa
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(videoBuffer.byteLength),
        "X-Nexium-Duration-Ms": String(durationMs),
        "X-Nexium-Frames": String(frames.length),
        "X-Nexium-Filename": filename,
      },
    });
  } catch (error) {
    console.error("[video-export] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("[video-export] Cleanup failed:", cleanupError);
      }
    }
  }
}
