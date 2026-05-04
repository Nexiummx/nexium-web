#!/usr/bin/env node
/**
 * render-gsap-video.mjs
 *
 * Renderiza un archivo HTML animado con GSAP a un video MP4 frame a frame.
 * Determinístico: usa tl.pause() + tl.seek(frame/fps) — el CPU no afecta el resultado.
 *
 * USO:
 *   node scripts/render-gsap-video.mjs <archivo.html> [opciones]
 *
 * OPCIONES:
 *   --fps <n>          Frames por segundo (default: 30)
 *   --duration <n>     Duración en segundos. Si se omite, se lee de tl.duration() o nexium:duration
 *   --width <n>        Ancho del viewport (default: 1080)
 *   --height <n>       Alto del viewport (default: 1920)
 *   --output <nombre>  Nombre del archivo de salida sin extensión (default: nombre del HTML)
 *   --crf <n>          CRF de libx264 (default: 18 — visualmente lossless)
 *   --preset <s>       Preset de ffmpeg: ultrafast..veryslow (default: slow)
 *   --keep-frames      No borrar los PNGs temporales al terminar
 *
 * EJEMPLOS:
 *   node scripts/render-gsap-video.mjs src/flyer.html
 *   node scripts/render-gsap-video.mjs src/flyer.html --duration 15 --fps 60 --output mi-reel
 *
 * REQUISITOS:
 *   - El HTML debe exponer su timeline GSAP como window.tl (variable global)
 *   - Si hay varias timelines, exponer la principal como window.tl
 *   - Las fuentes externas (Google Fonts etc.) se cargan normalmente
 */

import puppeteer from "puppeteer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ── Parsear argumentos ──────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  printHelp();
  process.exit(0);
}

const htmlArg = args[0];
const opts = parseArgs(args.slice(1));

function parseArgs(arr) {
  const o = {
    fps: 30,
    duration: null,
    width: 1080,
    height: 1920,
    output: null,
    crf: 18,
    preset: "slow",
    keepFrames: false,
  };
  for (let i = 0; i < arr.length; i++) {
    switch (arr[i]) {
      case "--fps":       o.fps = Number(arr[++i]); break;
      case "--duration":  o.duration = Number(arr[++i]); break;
      case "--width":     o.width = Number(arr[++i]); break;
      case "--height":    o.height = Number(arr[++i]); break;
      case "--output":    o.output = arr[++i]; break;
      case "--crf":       o.crf = Number(arr[++i]); break;
      case "--preset":    o.preset = arr[++i]; break;
      case "--keep-frames": o.keepFrames = true; break;
    }
  }
  return o;
}

function printHelp() {
  console.log(`
  render-gsap-video — renderiza HTML animado con GSAP a MP4 frame a frame

  USO:
    node scripts/render-gsap-video.mjs <archivo.html> [opciones]

  OPCIONES:
    --fps <n>          FPS (default: 30)
    --duration <n>     Duración en segundos (default: auto desde tl.duration())
    --width <n>        Ancho viewport (default: 1080)
    --height <n>       Alto viewport (default: 1920)
    --output <nombre>  Nombre de salida sin .mp4 (default: nombre del HTML)
    --crf <n>          CRF libx264 (default: 18, rango 0-51)
    --preset <s>       Preset ffmpeg (default: slow)
    --keep-frames      No borrar PNGs temporales
  `);
}

// ── Resolver rutas ──────────────────────────────────────────────────────────

const htmlPath = path.resolve(process.cwd(), htmlArg);

if (!fsSync.existsSync(htmlPath)) {
  console.error(`\n❌ No se encontró el archivo: ${htmlPath}\n`);
  process.exit(1);
}

const baseName = opts.output ?? path.basename(htmlPath, path.extname(htmlPath));
const outputMp4 = path.resolve(process.cwd(), `${baseName}.mp4`);
const framesDir = path.resolve(process.cwd(), `.frames-${baseName}-${Date.now()}`);

// ── Funciones auxiliares ────────────────────────────────────────────────────

function log(msg) {
  const time = new Date().toLocaleTimeString("es-MX", { hour12: false });
  console.log(`[${time}] ${msg}`);
}

function progressBar(current, total, width = 30) {
  const pct = current / total;
  const filled = Math.round(pct * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const percent = (pct * 100).toFixed(1).padStart(5);
  return `${bar} ${percent}%  ${current}/${total}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🎬 render-gsap-video");
  console.log("─".repeat(50));
  log(`HTML:     ${htmlPath}`);
  log(`Viewport: ${opts.width}×${opts.height}`);
  log(`FPS:      ${opts.fps}`);
  if (opts.duration) log(`Duración: ${opts.duration}s (override)`);

  // ── 1. Lanzar Puppeteer ──────────────────────────────────────────────────
  log("Iniciando Puppeteer…");
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: 1,
    },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
      // Necesario para que GSAP controle el tiempo sin interferencias del scheduler
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
    ],
  });

  const page = await browser.newPage();

  // Capturar errores del HTML para diagnóstico
  page.on("pageerror", (err) => {
    console.warn("  [browser error]", err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.warn("  [browser console error]", msg.text());
    }
  });

  // ── 2. Cargar el HTML ────────────────────────────────────────────────────
  log("Cargando HTML…");
  const fileUrl = `file://${htmlPath}`;
  await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 30000 });

  // Esperar a que las fonts estén listas
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  // ── 3. Detectar y pausar la timeline GSAP ───────────────────────────────
  log("Pausando timeline GSAP…");

  const gsapInfo = await page.evaluate(() => {
    // Buscar la timeline en window.tl (convención estándar)
    // También intentar window.timeline, window.masterTl como fallbacks
    const candidates = ["tl", "videoTimeline", "timeline", "masterTl", "mainTl", "tl1", "gsapTl", "anim"];
    let found = null;

    for (const name of candidates) {
      const val = window[name];
      if (val && typeof val.pause === "function" && typeof val.seek === "function") {
        found = name;
        break;
      }
    }

    if (!found) {
      // Último recurso: buscar en GSAP registry si está disponible
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.pause();
        return {
          found: "gsap.globalTimeline",
          duration: window.gsap.globalTimeline.duration(),
          isGlobal: true,
        };
      }
      return { found: null, duration: 0, isGlobal: false };
    }

    window[found].pause();
    window[found].seek(0);

    return {
      found,
      duration: window[found].duration(),
      isGlobal: false,
    };
  });

  if (!gsapInfo.found) {
    await browser.close();
    console.error(`
❌ No se encontró una timeline GSAP en window.

   El script busca las variables: tl, timeline, masterTl, mainTl, tl1
   y también window.gsap.globalTimeline como fallback.

   Asegúrate de que tu HTML exponga la timeline principal como variable global:

     const tl = gsap.timeline();  // ✓ ya es global si está fuera de una función
     window.tl = gsap.timeline(); // ✓ explícito

   Si la timeline está dentro de una función o módulo ES, exponla manualmente:
     window.tl = tl;
`);
    process.exit(1);
  }

  log(`Timeline encontrada: window.${gsapInfo.found} (duración: ${gsapInfo.duration.toFixed(3)}s)`);

  // ── 4. Resolver duración ─────────────────────────────────────────────────
  let durationSeconds = opts.duration;

  if (!durationSeconds) {
    // Intentar leer meta tag nexium:duration como fallback
    const metaDuration = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="nexium:duration"]');
      return meta ? parseFloat(meta.getAttribute("content") ?? "0") : 0;
    });

    if (metaDuration > 0) {
      durationSeconds = metaDuration;
      log(`Duración desde meta tag: ${durationSeconds}s`);
    } else if (gsapInfo.duration > 0) {
      durationSeconds = gsapInfo.duration;
      log(`Duración desde tl.duration(): ${durationSeconds.toFixed(3)}s`);
    } else {
      await browser.close();
      console.error(`
❌ No se pudo determinar la duración del video.

   Opciones:
   1. Pasar --duration <segundos> como argumento al script
   2. Agregar <meta name="nexium:duration" content="12"> al HTML
   3. Asegurarse de que tl.duration() devuelve un valor > 0
`);
      process.exit(1);
    }
  }

  const totalFrames = Math.round(durationSeconds * opts.fps);
  const frameDurationSec = 1 / opts.fps;

  log(`Total de frames: ${totalFrames} (${durationSeconds}s × ${opts.fps}fps)`);

  // ── 5. Crear carpeta temporal para los frames ────────────────────────────
  await fs.mkdir(framesDir, { recursive: true });
  log(`Carpeta de frames: ${framesDir}`);

  // ── 6. Captura frame por frame ───────────────────────────────────────────
  console.log("\n📸 Capturando frames…\n");

  const captureStart = Date.now();
  const framePaths = [];

  for (let i = 0; i < totalFrames; i++) {
    const seekTime = i * frameDurationSec;

    // Mover la timeline GSAP exactamente al tiempo de este frame
    await page.evaluate(
      ({ name, time, isGlobal }) => {
        if (isGlobal) {
          window.gsap.globalTimeline.seek(time, false);
        } else {
          window[name].seek(time, false);
        }
      },
      { name: gsapInfo.found, time: seekTime, isGlobal: gsapInfo.isGlobal }
    );

    // Forzar un paint sincrónico antes del screenshot
    // (requestAnimationFrame + microtask flush)
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => setTimeout(resolve, 0));
        })
    );

    const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);

    await page.screenshot({
      path: framePath,
      type: "png",
      omitBackground: false,
    });

    framePaths.push(framePath);

    // Actualizar barra de progreso cada 5 frames
    if (i % 5 === 0 || i === totalFrames - 1) {
      const elapsed = (Date.now() - captureStart) / 1000;
      const eta =
        i > 0 ? ((elapsed / (i + 1)) * (totalFrames - i - 1)).toFixed(0) : "?";
      process.stdout.write(
        `\r  ${progressBar(i + 1, totalFrames)}  ${elapsed.toFixed(1)}s  ETA: ${eta}s   `
      );
    }
  }

  const captureElapsed = ((Date.now() - captureStart) / 1000).toFixed(1);
  process.stdout.write("\n");
  log(`Captura completada en ${captureElapsed}s`);

  await browser.close();

  // ── 7. Encodear con ffmpeg ───────────────────────────────────────────────
  console.log("\n🎞  Codificando MP4…\n");

  await encodeToMp4({
    framesDir,
    outputPath: outputMp4,
    fps: opts.fps,
    width: opts.width,
    height: opts.height,
    crf: opts.crf,
    preset: opts.preset,
  });

  // ── 8. Limpiar frames temporales ─────────────────────────────────────────
  if (!opts.keepFrames) {
    log("Borrando frames temporales…");
    await fs.rm(framesDir, { recursive: true, force: true });
  } else {
    log(`Frames conservados en: ${framesDir}`);
  }

  // ── 9. Resumen final ─────────────────────────────────────────────────────
  const stat = await fs.stat(outputMp4);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(2);

  console.log("\n✅ Listo");
  console.log("─".repeat(50));
  log(`Archivo:  ${outputMp4}`);
  log(`Tamaño:   ${sizeMb} MB`);
  log(`Frames:   ${framePaths.length}`);
  log(`Duración: ${durationSeconds}s @ ${opts.fps}fps`);
  console.log("");
}

// ── Encoder ffmpeg ──────────────────────────────────────────────────────────

function encodeToMp4({ framesDir, outputPath, fps, width, height, crf, preset }) {
  const inputPattern = path.join(framesDir, "frame-%05d.png");

  // Dimensiones pares obligatorias para yuv420p
  const safeW = width % 2 === 0 ? width : width + 1;
  const safeH = height % 2 === 0 ? height : height + 1;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPattern)
      .inputFPS(fps)
      .videoCodec("libx264")
      .outputOptions([
        "-pix_fmt yuv420p",
        `-preset ${preset}`,
        `-crf ${crf}`,
        `-vf scale=${safeW}:${safeH}`,
        // faststart: mueve el header al inicio — necesario para Instagram y streaming
        "-movflags +faststart",
        `-r ${fps}`,
        // Bitrate mínimo garantizado para Instagram (recomiendan ≥ 3.5Mbps para Stories)
        "-b:v 8M",
        "-maxrate 10M",
        "-bufsize 20M",
      ])
      .output(outputPath)
      .on("start", (cmd) => {
        console.log("  cmd:", cmd.replace(/\s+-/g, "\n       -"));
        console.log("");
      })
      .on("progress", (p) => {
        if (p.percent != null) {
          process.stdout.write(
            `\r  Progreso: ${p.percent.toFixed(1).padStart(5)}%  timemark: ${p.timemark ?? "—"}   `
          );
        }
      })
      .on("end", () => {
        process.stdout.write("\n");
        resolve();
      })
      .on("error", (err) => {
        process.stdout.write("\n");
        reject(err);
      })
      .run();
  });
}

// ── Ejecutar ────────────────────────────────────────────────────────────────

main().catch(async (err) => {
  console.error("\n❌ Error fatal:", err.message);
  // Limpiar carpeta de frames si algo salió mal
  if (!opts.keepFrames && fsSync.existsSync(framesDir)) {
    await fs.rm(framesDir, { recursive: true, force: true }).catch(() => {});
  }
  process.exit(1);
});
