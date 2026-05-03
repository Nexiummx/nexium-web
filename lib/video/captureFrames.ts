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

    // Esperar a que las fonts carguen (retorna una Promise nativa del browser)
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    // Buffer adicional para garantizar que todo esté pintado
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Pausar todas las animaciones CSS al frame 0
    const animCount = await page.evaluate(() => {
      const allAnims = document.getAnimations();
      allAnims.forEach((a) => a.pause());
      return allAnims.length;
    });

    console.log(`[captureFrames] Pausadas ${animCount} animaciones`);

    for (let i = 0; i < totalFrames; i++) {
      const currentTimeMs = i * frameDurationMs;

      // Mover cada animación al tiempo correspondiente al frame
      await page.evaluate((time) => {
        document.getAnimations().forEach((a) => {
          a.currentTime = time;
        });
      }, currentTimeMs);

      // Pequeño delay para que el browser procese el cambio
      await new Promise((resolve) => setTimeout(resolve, 16));

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
