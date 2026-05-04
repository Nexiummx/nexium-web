import path from "path";
import fs from "fs/promises";
import type { CaptureFramesOptions } from "./types";

/**
 * Lanza Puppeteer en modo serverless-compatible y captura N frames
 * de una página HTML animada.
 *
 * Estrategia:
 * 1. Carga el HTML vía data URL (evita problemas de red en Vercel)
 * 2. Espera a que las fonts estén listas
 * 3. Pausa todas las animaciones CSS al inicio
 * 4. Para cada frame: avanza el tiempo de las animaciones, screenshot
 */
export async function captureFrames(
  options: CaptureFramesOptions
): Promise<string[]> {
  const { html, durationSeconds, fps, width, height, outputDir } = options;
  const totalFrames = Math.round(durationSeconds * fps);
  const frameDurationMs = 1000 / fps;

  await fs.mkdir(outputDir, { recursive: true });

  // Importar Puppeteer dinámicamente para soportar entornos local y Vercel
  let browser;

  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width, height, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    const puppeteer = (await import("puppeteer")).default;
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width, height, deviceScaleFactor: 1 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const framePaths: string[] = [];

  try {
    const page = await browser.newPage();

    // Cargar HTML vía data URL para evitar problemas de red en serverless
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Esperar a que las fonts carguen
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    // Buffer para garantizar que GSAP y CSS estén pintados
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Detectar motor de animación y pausar al frame 0
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

      // Fallback: globalTimeline de GSAP
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

      // CSS puro — pausar Web Animations API
      const cssAnims = document.getAnimations();
      cssAnims.forEach((a) => a.pause());
      const maxDur = cssAnims.reduce((max, a) => {
        const d = a.effect?.getTiming().duration;
        return typeof d === "number" && d > max ? d : max;
      }, 0);
      return { engine: "css" as const, gsapName: null, duration: maxDur / 1000 };
    });

    console.log(
      `[captureFrames] Motor: ${engineInfo.engine.toUpperCase()} · duración: ${engineInfo.duration.toFixed(2)}s`
    );

    for (let i = 0; i < totalFrames; i++) {
      const currentTimeMs = i * frameDurationMs;
      const currentTimeSec = i / fps;

      if (engineInfo.engine === "gsap") {
        // GSAP: seek al segundo exacto (false = sin disparar callbacks)
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
        // CSS puro: mover cada animación por currentTime
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

      const framePath = path.join(
        outputDir,
        `frame-${String(i).padStart(5, "0")}.png`
      );

      await page.screenshot({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path: framePath as any,
        type: "png",
        omitBackground: false,
      });

      framePaths.push(framePath);

      if (i % 30 === 0) {
        console.log(`[captureFrames] Frame ${i + 1}/${totalFrames}`);
      }
    }

    return framePaths;
  } finally {
    await browser.close();
  }
}
