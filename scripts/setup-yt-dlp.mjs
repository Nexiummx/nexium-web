#!/usr/bin/env node
/**
 * Descarga el binario standalone de yt-dlp en ./bin para /tools/downloader.
 *
 *   npm run setup:downloader
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

const key = `${process.platform}-${process.arch}`;
const asset = ASSETS[key];
if (!asset) {
  console.error(`✗ Plataforma no soportada: ${key}. Instala yt-dlp manualmente y define YTDLP_PATH.`);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = path.join(root, "bin");
const target = path.join(binDir, process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

console.log(`↓ Descargando ${asset} …`);
const res = await fetch(`${BASE}/${asset}`);
if (!res.ok) {
  console.error(`✗ Error ${res.status} al descargar ${asset}`);
  process.exit(1);
}

await fs.mkdir(binDir, { recursive: true });
await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
await fs.chmod(target, 0o755);
console.log(`✓ yt-dlp listo en ${path.relative(root, target)}`);
