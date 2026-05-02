/**
 * Nexium — Conversor HTML → PNG (uso interno)
 *
 * Uso:
 *   node scripts/html-to-png.cjs <archivo.html> [directorio-salida]
 *
 * Requiere NEXIUM_TOOL_TOKEN en .env.local
 */

"use strict";

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// ── Leer .env.local manualmente (sin dependencia de dotenv) ──────────────────
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    vars[key] = val;
  }
  return vars;
}

// ── Verificar token ──────────────────────────────────────────────────────────
function checkToken(env) {
  const REQUIRED_TOKEN_KEY = "NEXIUM_TOOL_TOKEN";
  const token =
    process.env[REQUIRED_TOKEN_KEY] || env[REQUIRED_TOKEN_KEY] || "";

  if (!token) {
    console.error(
      `\n[html-to-png] ERROR: Falta el token de acceso.\n` +
        `  Agrega "${REQUIRED_TOKEN_KEY}=tu_token_secreto" en .env.local\n` +
        `  o pásalo como variable de entorno.\n`
    );
    process.exit(1);
  }
}

// ── Formatear número con ceros a la izquierda ────────────────────────────────
function pad(n, digits = 2) {
  return String(n).padStart(digits, "0");
}

// ── Principal ────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnvLocal();
  checkToken(env);

  const htmlArg = process.argv[2];
  if (!htmlArg) {
    console.error(
      "\n[html-to-png] Uso: node scripts/html-to-png.cjs <archivo.html> [directorio-salida]\n"
    );
    process.exit(1);
  }

  const htmlPath = path.resolve(process.cwd(), htmlArg);
  if (!fs.existsSync(htmlPath)) {
    console.error(`\n[html-to-png] ERROR: No se encontró el archivo: ${htmlPath}\n`);
    process.exit(1);
  }

  // Directorio de salida: segundo argumento o output/slides/
  const outputDirArg = process.argv[3];
  const outputDir = outputDirArg
    ? path.resolve(process.cwd(), outputDirArg)
    : path.resolve(__dirname, "../output/slides");

  fs.mkdirSync(outputDir, { recursive: true });

  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  console.log(`\n[html-to-png] Iniciando render...`);
  console.log(`  Archivo:  ${htmlPath}`);
  console.log(`  Salida:   ${outputDir}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=none",
    ],
  });

  const page = await browser.newPage();

  // Viewport amplio para que todos los slides quepan verticalmente
  await page.setViewport({
    width: 1080,
    height: 50000,
    deviceScaleFactor: 1,
  });

  // Cargar el HTML con baseURL del directorio del archivo para que resources relativos funcionen
  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  // Esperar a que las fuentes de Google Fonts carguen
  await page.evaluateHandle("document.fonts.ready");

  // Detectar todos los elementos .post
  const postCount = await page.evaluate(() => {
    return document.querySelectorAll(".post").length;
  });

  if (postCount === 0) {
    console.error(
      '[html-to-png] ERROR: No se encontraron elementos con clase ".post" en el HTML.\n'
    );
    await browser.close();
    process.exit(1);
  }

  console.log(`[html-to-png] Slides encontrados: ${postCount}`);

  const results = [];

  for (let i = 0; i < postCount; i++) {
    const filename = `slide-${pad(i + 1)}.png`;
    const outputPath = path.join(outputDir, filename);

    // Capturar el elemento individual (pixel-perfect, sin recortes manuales)
    const elementHandle = await page.$$(`.post`);
    const el = elementHandle[i];

    if (!el) {
      console.warn(`  [!] Slide ${i + 1}: no se pudo obtener el elemento, omitiendo.`);
      continue;
    }

    await el.screenshot({
      path: outputPath,
      type: "png",
      omitBackground: false,
    });

    const stat = fs.statSync(outputPath);
    const sizeKb = (stat.size / 1024).toFixed(1);
    console.log(`  ✓ slide-${pad(i + 1)}.png  (${sizeKb} KB)`);
    results.push({ filename, path: outputPath, sizeKb });
  }

  await browser.close();

  console.log(`\n[html-to-png] Completado. ${results.length}/${postCount} slides generados.`);
  console.log(`  Directorio: ${outputDir}\n`);
}

main().catch((err) => {
  console.error("\n[html-to-png] ERROR inesperado:", err.message || err);
  process.exit(1);
});
