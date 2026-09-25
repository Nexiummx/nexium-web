#!/usr/bin/env node
/**
 * Descarga el binario standalone de yt-dlp en ./bin para /tools/downloader.
 *
 *   npm run setup:downloader
 *
 * En Vercel corre en cada deploy vía `vercel-build` con --optional:
 * si la descarga falla, avisa pero no rompe el build.
 *
 * No requiere Python. Vuelve a ejecutarlo para actualizar yt-dlp
 * (las plataformas cambian seguido y las versiones viejas dejan de funcionar).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const BASE = "https://github.com/yt-dlp/yt-dlp/releases/latest/download";

const ASSETS = {
  "linux-x64": "yt-dlp_linux",
  "linux-arm64": "yt-dlp_linux_aarch64",
  "darwin-x64": "yt-dlp_macos",
  "darwin-arm64": "yt-dlp_macos",
  "win32-x64": "yt-dlp.exe",
  "win32-arm64": "yt-dlp.exe",
};

const OPTIONAL = process.argv.includes("--optional");
const fail = (msg) => {
  console.error(`${OPTIONAL ? "⚠" : "✗"} ${msg}`);
  process.exit(OPTIONAL ? 0 : 1);
};

const key = `${process.platform}-${process.arch}`;
const asset = ASSETS[key];
if (!asset) {
  fail(`Plataforma no soportada: ${key}. Instala yt-dlp manualmente y define YTDLP_PATH.`);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = path.join(root, "bin");
const target = path.join(binDir, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

console.log(`↓ Descargando ${asset} …`);
const res = await fetch(`${BASE}/${asset}`).catch((err) => fail(`No se pudo descargar ${asset}: ${err.message}`));
if (!res.ok) fail(`Error ${res.status} al descargar ${asset}`);

await fs.mkdir(binDir, { recursive: true });
await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
await fs.chmod(target, 0o755);
console.log(`✓ yt-dlp listo en ${path.relative(root, target)}`);
