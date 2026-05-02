import { NextRequest, NextResponse } from "next/server";

// URL del pack de Chromium para Vercel (Sparticuz v147 compatible con puppeteer-core 24.x)
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar";

const SLIDE_W = 1080;
const SLIDE_H = 1350;

// Timeout de la función serverless en Vercel (Pro: 300s, Free: 60s)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function getBrowser() {
  // En Vercel (producción y preview): usar chromium-min ligero
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;

    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);

    return puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--font-render-hinting=none",
        "--disable-web-security",
      ],
      executablePath,
      headless: true,
    });
  }

  // Localmente: usar puppeteer con Chromium bundled
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });
}

// Token hardcodeado — no depende de variables de entorno para evitar
// problemas de sincronización entre .env.local y Vercel dashboard.
// Para cambiarlo: actualizar este valor Y el TOOL_TOKEN en page.tsx.
const TOOL_TOKEN = "nexium-slides-2026";

export async function POST(req: NextRequest) {
  // Verificar token de acceso
  const authHeader = req.headers.get("x-nexium-token");
  // Aceptar el token del env (si está configurado en Vercel) o el hardcodeado
  const expectedToken = process.env.NEXIUM_TOOL_TOKEN || TOOL_TOKEN;
  if (!authHeader || authHeader !== expectedToken) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: { html?: string; format?: "png" | "jpg" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const { html, format = "png" } = body;
  if (!html?.trim()) {
    return NextResponse.json({ error: "HTML requerido." }, { status: 400 });
  }

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();

    // Viewport amplio para contener todos los slides
    await page.setViewport({
      width: SLIDE_W,
      height: SLIDE_H * 20,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Esperar fuentes
    await page.evaluateHandle("document.fonts.ready");
    // Buffer extra para Google Fonts
    await new Promise((r) => setTimeout(r, 1500));

    // Detectar slides
    const postCount = await page.evaluate(() => {
      return document.querySelectorAll(".post").length;
    });

    if (postCount === 0) {
      await browser.close();
      return NextResponse.json(
        { error: 'No se encontraron elementos ".post" en el HTML.' },
        { status: 422 }
      );
    }

    // Capturar cada slide
    const slides: { index: number; dataUrl: string }[] = [];

    for (let i = 0; i < postCount; i++) {
      const handles = await page.$$(".post");
      const el = handles[i];
      if (!el) continue;

      const screenshotBuffer = await el.screenshot({
        type: format === "jpg" ? "jpeg" : "png",
        quality: format === "jpg" ? 95 : undefined,
        omitBackground: false,
      });

      const base64 = Buffer.from(screenshotBuffer).toString("base64");
      const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
      slides.push({
        index: i,
        dataUrl: `data:${mimeType};base64,${base64}`,
      });
    }

    await browser.close();

    return NextResponse.json({ slides, count: postCount });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    const message = err instanceof Error ? err.message : "Error interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
