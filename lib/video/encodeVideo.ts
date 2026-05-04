import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import type { EncodeVideoOptions } from "./types";
import { VIDEO_QUALITY } from "./config";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Ensambla frames PNG numerados (frame-00000.png, frame-00001.png…)
 * en un MP4 H.264 de calidad máxima.
 *
 * Nota: los dos filtros de video (scale + pad) se combinan en una sola
 * instrucción -vf para evitar que ffmpeg rechace opciones duplicadas.
 */
export async function encodeVideo(options: EncodeVideoOptions): Promise<void> {
  const { framesDir, outputPath, fps, width, height } = options;

  const inputPattern = path.join(framesDir, "frame-%05d.png");

  // Asegurar dimensiones pares (requerido por H.264 yuv420p)
  const safeW = width % 2 === 0 ? width : width + 1;
  const safeH = height % 2 === 0 ? height : height + 1;

  const vf = `scale=${safeW}:${safeH}:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2`;

  console.log(`[encodeVideo] ${fps}fps · ${safeW}×${safeH} · CRF ${VIDEO_QUALITY.CRF} · preset ${VIDEO_QUALITY.PRESET}`);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputFPS(fps)
      .videoCodec("libx264")
      .outputOptions([
        `-pix_fmt ${VIDEO_QUALITY.PIX_FMT}`,
        `-preset ${VIDEO_QUALITY.PRESET}`,
        `-crf ${VIDEO_QUALITY.CRF}`,
        `-vf ${vf}`,
        "-movflags +faststart",
        `-r ${fps}`,
      ])
      .output(outputPath)
      .on("start", (cmd) => {
        console.log("[encodeVideo] ffmpeg cmd:", cmd);
      })
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`[encodeVideo] ${progress.percent.toFixed(1)}%`);
        }
      })
      .on("end", () => {
        console.log("[encodeVideo] Encoding complete");
        resolve();
      })
      .on("error", (err) => {
        console.error("[encodeVideo] Error:", err.message);
        reject(err);
      })
      .run();
  });
}
