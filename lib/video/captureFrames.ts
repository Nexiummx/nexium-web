import path from "path";
import fs from "fs/promises";
import type { CaptureFramesOptions } from "./types";
import { buildVideoIframeDocument } from "./iframeBridge";

/**
 * Lanza Puppeteer localmente y captura frames PNG frame a frame.
 * Diseñado para correr en local con el script render-gsap-video.mjs.
 * No está pensado para Vercel serverless (60s es insuficiente para videos de calidad).
 *
 * Estrategia:
 * 1. Carga el HTML vía data URL
 * 2. Espera fonts y paint inicial
 * 3. Detecta motor de animación (GSAP o Web Animations API)
 * 4. Para cada frame: avanza el tiempo, fuerza paint, screenshot PNG
 */
export async function captureFrames(
  options: CaptureFramesOptions
): Promise<string[]> {
  const { html, durationSeconds, fps, width, height, outputDir, motionApply } = options;
  const bridgedHtml = buildVideoIframeDocument(html, motionApply ?? { gsap: [], css: [] });
  const totalFrames = Math.round(durationSeconds * fps);
  const frameDurationMs = 1000 / fps;

  await fs.mkdir(outputDir, { recursive: true });

  const isVercel = Boolean(process.env.VERCEL);

  let browser;

  if (isVercel) {
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
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--font-render-hinting=none",
      ],
    });
  }

  const framePaths: string[] = [];

  try {
    const page = await browser.newPage();

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(bridgedHtml)}`;
    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 30000 });

    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    // Buffer para que GSAP y CSS terminen de inicializar
    await new Promise((resolve) => setTimeout(resolve, 600));

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
      `[captureFrames] Motor: ${engineInfo.engine.toUpperCase()} · duración: ${engineInfo.duration.toFixed(2)}s · ` +
      `${totalFrames} frames @ ${fps}fps · ${width}×${height}`
    );

    for (let i = 0; i < totalFrames; i++) {
      const currentTimeMs = i * frameDurationMs;
      const currentTimeSec = i / fps;

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
