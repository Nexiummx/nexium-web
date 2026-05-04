import path from "path";
import fs from "fs/promises";
import type { CaptureFramesOptions } from "./types";
import { CAPTURE_FPS, SERVERLESS_SCALE } from "./config";

/**
 * Lanza Puppeteer en modo serverless-compatible y captura N frames
 * de una página HTML animada.
 *
 * Optimizaciones para Vercel Hobby (60s timeout):
 * - Captura a CAPTURE_FPS (ej. 10fps) en vez del FPS final del video.
 *   FFmpeg interpola al FPS objetivo al encodear → 3x menos screenshots.
 * - En Vercel: viewport a 50% de la resolución final → 4x menos píxeles.
 *   FFmpeg reescala al tamaño correcto al encodear.
 * - Screenshots en JPEG en vez de PNG → escritura a disco 2-3x más rápida.
 */
export async function captureFrames(
  options: CaptureFramesOptions
): Promise<string[]> {
  const { html, durationSeconds, fps, width, height, outputDir } = options;

  const isVercel = Boolean(process.env.VERCEL);

  // En Vercel capturamos a menos FPS y FFmpeg interpola al final
  const captureFps = Math.min(CAPTURE_FPS, fps);
  const totalFrames = Math.round(durationSeconds * captureFps);
  const frameDurationMs = 1000 / captureFps;

  // En Vercel usamos resolución reducida; FFmpeg reescala al encodear
  const scale = isVercel ? SERVERLESS_SCALE : 1;
  const captureWidth = Math.round(width * scale);
  const captureHeight = Math.round(height * scale);

  console.log(
    `[captureFrames] captureFps=${captureFps} totalFrames=${totalFrames} ` +
    `viewport=${captureWidth}×${captureHeight} (escala=${scale}) isVercel=${isVercel}`
  );

  await fs.mkdir(outputDir, { recursive: true });

  let browser;

  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width: captureWidth, height: captureHeight, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = (await import("puppeteer")).default;
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: captureWidth, height: captureHeight, deviceScaleFactor: 1 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const framePaths: string[] = [];

  try {
    const page = await browser.newPage();

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 30000 });

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    // Buffer para que GSAP y CSS estén pintados antes de detectar el motor
    await new Promise((resolve) => setTimeout(resolve, 500));

    const engineInfo = await page.evaluate(() => {
      const GSAP_NAMES = ["tl", "videoTimeline", "timeline", "masterTl", "mainTl", "tl1", "gsapTl", "anim"];
      let gsapName: string | null = null;

      for (const name of GSAP_NAMES) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidate = (window as any)[name];
        if (candidate && typeof candidate.pause === "function" && typeof candidate.seek === "function") {
          gsapName = name;
          break;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!gsapName && w.gsap?.globalTimeline) {
        gsapName = "__gsap_global__";
      }

      if (gsapName) {
        const tl = gsapName === "__gsap_global__" ? w.gsap.globalTimeline : w[gsapName];
        tl.pause();
        tl.seek(0, false);
        return { engine: "gsap" as const, gsapName, duration: tl.duration() as number };
      }

      const cssAnims = document.getAnimations();
      cssAnims.forEach((a) => a.pause());
      const maxDur = cssAnims.reduce((max, a) => {
        const d = a.effect?.getTiming().duration;
        return typeof d === "number" && d > max ? d : max;
      }, 0);
      return { engine: "css" as const, gsapName: null, duration: maxDur / 1000 };
    });

    console.log(
      `[captureFrames] Motor: ${engineInfo.engine.toUpperCase()} · duración detectada: ${engineInfo.duration.toFixed(2)}s`
    );

    for (let i = 0; i < totalFrames; i++) {
      const currentTimeMs = i * frameDurationMs;
      const currentTimeSec = i / captureFps;

      if (engineInfo.engine === "gsap") {
        await page.evaluate(
          ({ name, sec }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const w = window as any;
            const tl = name === "__gsap_global__" ? w.gsap.globalTimeline : w[name];
            tl.seek(sec, false);
          },
          { name: engineInfo.gsapName!, sec: currentTimeSec }
        );
      } else {
        await page.evaluate((ms) => {
          document.getAnimations().forEach((a) => {
            a.currentTime = ms;
          });
        }, currentTimeMs);
      }

      // Forzar paint sincrónico antes del screenshot
      await page.evaluate(
        () => new Promise<void>((resolve) => {
          requestAnimationFrame(() => setTimeout(resolve, 0));
        })
      );

      // JPEG es 2-3x más rápido de escribir que PNG; suficiente para social media
      const framePath = path.join(
        outputDir,
        `frame-${String(i).padStart(5, "0")}.jpg`
      );

      await page.screenshot({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path: framePath as any,
        type: "jpeg",
        quality: 90,
        omitBackground: false,
      });

      framePaths.push(framePath);

      if (i % 10 === 0) {
        console.log(`[captureFrames] Frame ${i + 1}/${totalFrames}`);
      }
    }

    return framePaths;
  } finally {
    await browser.close();
  }
}
