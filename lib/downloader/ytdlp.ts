import { spawn } from "child_process";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import net from "net";
import os from "os";
import type { DownloadQuality, VideoInfo } from "./types";

/** Límites para no saturar el servidor ni la función serverless */
export const DOWNLOAD_LIMITS = {
  MAX_FILESIZE: "500M",
  INFO_TIMEOUT_MS: 30_000,
  DOWNLOAD_TIMEOUT_MS: 10 * 60_000,
};

export class YtDlpMissingError extends Error {
  constructor() {
    super(
      "yt-dlp no está instalado. Ejecuta `npm run setup:downloader` o define YTDLP_PATH."
    );
    this.name = "YtDlpMissingError";
  }
}

/**
 * Busca el binario de yt-dlp en este orden:
 * 1. YTDLP_PATH (variable de entorno)
 * 2. ./bin/yt-dlp (`npm run setup:downloader`; en Vercel se descarga en el build)
 * 3. `yt-dlp` en el PATH del sistema
 */
export function resolveYtDlpPath(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  const exe = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  const local = path.join(process.cwd(), "bin", exe);
  if (fs.existsSync(local)) return ensureExecutable(local);
  return exe;
}

/**
 * En Vercel el bundle es de solo lectura y puede perder el bit de ejecución.
 * Si el binario no es ejecutable, se copia a /tmp y se le da permiso ahí.
 */
function ensureExecutable(file: string): string {
  if (process.platform === "win32") return file;
  try {
    fs.accessSync(file, fs.constants.X_OK);
    return file;
  } catch {
    const copy = path.join(os.tmpdir(), `nexium-${path.basename(file)}`);
    if (!fs.existsSync(copy)) {
      fs.copyFileSync(file, copy);
      fs.chmodSync(copy, 0o755);
    }
    return copy;
  }
}

/** Hosts que nunca debemos pedirle a yt-dlp que visite (SSRF) */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  if (net.isIPv4(host)) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (net.isIPv6(host)) {
    return (
      host === "::" ||
      host === "::1" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe80") ||
      host.startsWith("::ffff:")
    );
  }
  return false;
}

/**
 * Valida y normaliza la URL que pega el usuario.
 * Lanza Error con un mensaje listo para mostrar si no es válida.
 */
export function parseVideoUrl(input: unknown): string {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Pega la URL del video.");
  }
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("La URL no es válida.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Solo se aceptan URLs http(s).");
  }
  if (isPrivateHost(url.hostname)) {
    throw new Error("Esa URL apunta a una red privada.");
  }
  return url.toString();
}

/**
 * Argumentos de formato para yt-dlp según la calidad elegida.
 * Usamos format-sort (-S) en vez de filtros estrictos para que siempre
 * haya un resultado aunque la resolución exacta no exista.
 */
export function buildFormatArgs(quality: DownloadQuality): string[] {
  switch (quality) {
    case "audio":
      return ["-f", "ba/b", "-x", "--audio-format", "mp3", "--audio-quality", "0"];
    case "1080":
    case "720":
    case "480":
      return [
        "-f", "bv*+ba/b",
        "-S", `res:${quality},vcodec:h264,ext:mp4:m4a`,
        "--merge-output-format", "mp4",
      ];
    case "best":
    default:
      return [
        "-f", "bv*+ba/b",
        "-S", "vcodec:h264,ext:mp4:m4a",
        "--merge-output-format", "mp4",
      ];
  }
}

/** Convierte el JSON de `yt-dlp -J` en el resumen que usa el panel */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function summarizeInfo(raw: any): VideoInfo {
  const formats: Array<{ height?: number | null; vcodec?: string }> =
    Array.isArray(raw?.formats) ? raw.formats : [];
  const heights = Array.from(
    new Set(
      formats
        .filter((f) => typeof f.height === "number" && f.height > 0 && f.vcodec !== "none")
        .map((f) => f.height as number)
    )
  ).sort((a, b) => b - a);

  return {
    id: String(raw?.id ?? ""),
    title: String(raw?.title ?? "video"),
    uploader: raw?.uploader ?? raw?.channel ?? null,
    platform: String(raw?.extractor_key ?? raw?.extractor ?? "Web"),
    durationSeconds: typeof raw?.duration === "number" ? raw.duration : null,
    thumbnail: typeof raw?.thumbnail === "string" ? raw.thumbnail : null,
    webpageUrl: String(raw?.webpage_url ?? raw?.original_url ?? ""),
    heights,
  };
}

/** Nombre de archivo seguro para Content-Disposition / Blob */
export function sanitizeFilename(name: string): string {
  const clean = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._ -]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return clean || "video";
}

interface RunResult {
  stdout: string;
  stderr: string;
}

function runYtDlp(args: string[], timeoutMs: number): Promise<RunResult> {
  const bin = resolveYtDlpPath();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("La descarga tardó demasiado y se canceló."));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(err.code === "ENOENT" ? new YtDlpMissingError() : err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(cleanYtDlpError(stderr) || `yt-dlp terminó con código ${code}`));
    });
  });
}

/** Deja solo la última línea "ERROR: ..." de yt-dlp, sin el prefijo */
export function cleanYtDlpError(stderr: string): string {
  const lines = stderr.split("\n").map((l) => l.trim()).filter(Boolean);
  const errLine = [...lines].reverse().find((l) => l.startsWith("ERROR:"));
  return (errLine ?? lines[lines.length - 1] ?? "")
    .replace(/^ERROR:\s*/, "")
    .slice(0, 300);
}

/** Argumentos comunes a info y descarga */
function baseArgs(): string[] {
  return ["--no-playlist", "--no-warnings", "--no-progress", "--no-cache-dir"];
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const { stdout } = await runYtDlp(
    [...baseArgs(), "-J", "--", url],
    DOWNLOAD_LIMITS.INFO_TIMEOUT_MS
  );
  return summarizeInfo(JSON.parse(stdout));
}

export interface DownloadResult {
  filePath: string;
  filename: string;
  contentType: string;
}

/**
 * Descarga el video en `outputDir` y devuelve la ruta del archivo final.
 * `ffmpegPath` se usa para unir video+audio y para extraer MP3.
 */
export async function downloadVideo(options: {
  url: string;
  quality: DownloadQuality;
  outputDir: string;
  ffmpegPath?: string;
}): Promise<DownloadResult> {
  const { url, quality, outputDir, ffmpegPath } = options;
  await fsp.mkdir(outputDir, { recursive: true });

  const args = [
    ...baseArgs(),
    ...buildFormatArgs(quality),
    "--max-filesize", DOWNLOAD_LIMITS.MAX_FILESIZE,
    "--restrict-filenames",
    "-o", path.join(outputDir, "%(title).80B [%(id)s].%(ext)s"),
  ];
  if (ffmpegPath) args.push("--ffmpeg-location", ffmpegPath);
  args.push("--", url);

  await runYtDlp(args, DOWNLOAD_LIMITS.DOWNLOAD_TIMEOUT_MS);

  const files = (await fsp.readdir(outputDir)).filter(
    (f) => !f.endsWith(".part") && !f.endsWith(".ytdl") && !/\.f\d+\./.test(f)
  );
  if (files.length === 0) {
    throw new Error(
      `No se generó ningún archivo (¿el video pesa más de ${DOWNLOAD_LIMITS.MAX_FILESIZE}?).`
    );
  }

  // Si quedó más de uno, el más grande es el resultado final
  const sized = await Promise.all(
    files.map(async (f) => ({ f, size: (await fsp.stat(path.join(outputDir, f))).size }))
  );
  sized.sort((a, b) => b.size - a.size);
  const file = sized[0].f;
  const ext = path.extname(file).slice(1).toLowerCase();

  return {
    filePath: path.join(outputDir, file),
    filename: sanitizeFilename(file),
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
  };
}

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
};
