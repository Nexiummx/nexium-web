import { NextRequest, NextResponse } from "next/server";

// URL del pack de Chromium para Vercel (Sparticuz v147 compatible con puppeteer-core 24.x)
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar";

const SLIDE_W = 1080;
const SLIDE_H = 1350;

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Token de acceso — mismo valor que ACCESS_TOKEN en page.tsx
const TOOL_TOKEN = "nexium-slides-2026";

async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
    return puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--font-render-hinting=none",
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
      ],
      executablePath,
      headless: true,
    });
  }
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-nexium-token");
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

    await page.setViewport({
      width: SLIDE_W,
      height: SLIDE_H * 20,
      deviceScaleFactor: 1,
    });

    // Usar data URL para evitar problemas de networking en Vercel serverless.
    // encodeURIComponent preserva todo el HTML incluyendo fuentes externas (Google Fonts).
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    await page.goto(dataUrl, {
      waitUntil: "networkidle0",
      timeout: 45000,
    });

    // Esperar fuentes de forma segura
    try {
      await page.evaluateHandle("document.fonts.ready");
    } catch {
      // silenciar si no está disponible
    }
    // Buffer extra para que Google Fonts y CSS terminen de aplicarse
    await new Promise((r) => setTimeout(r, 2000));

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
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
    const message = err instanceof Error ? err.message : "Error interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
