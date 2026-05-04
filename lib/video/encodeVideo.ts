import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import type { EncodeVideoOptions } from "./types";
import { VIDEO_QUALITY } from "./config";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Ensambla frames JPEG/PNG numerados en un MP4 H.264.
 *
 * Soporta captura a menor FPS que el video final (captureFps < fps):
 * FFmpeg duplica frames para alcanzar el FPS de salida, sin necesidad
 * de capturas extra en Puppeteer.
 *
 * También reescala al tamaño final correcto, ya que la captura puede
 * haberse hecho a resolución reducida para ahorrar tiempo en serverless.
 */
export async function encodeVideo(options: EncodeVideoOptions): Promise<void> {
  const { framesDir, outputPath, fps, captureFps, width, height } = options;

  // Detecta si los frames son JPEG o PNG según lo que haya en disco
  // Por convención: siempre usamos .jpg desde captureFrames optimizado
  const inputPattern = path.join(framesDir, "frame-%05d.jpg");

  // FPS de entrada = FPS al que se capturaron los frames
  const inputFps = captureFps ?? fps;

  // Asegurar dimensiones pares (requerido por H.264 yuv420p)
  const safeW = width % 2 === 0 ? width : width + 1;
  const safeH = height % 2 === 0 ? height : height + 1;

  // scale reescala al tamaño final, pad asegura dimensiones pares
  const vf = `scale=${safeW}:${safeH}:flags=lanczos,pad=ceil(iw/2)*2:ceil(ih/2)*2`;

  console.log(
    `[encodeVideo] inputFps=${inputFps} outputFps=${fps} tamaño=${safeW}×${safeH} preset=${VIDEO_QUALITY.PRESET}`
  );

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputFPS(inputFps)
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
