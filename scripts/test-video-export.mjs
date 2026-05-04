/**
 * Script de prueba manual del endpoint de export de video.
 *
 * Uso:
 *   # Asegúrate de tener el dev server corriendo:
 *   npm run dev
 *
 *   # En otra terminal:
 *   node scripts/test-video-export.mjs
 *
 *   # Para probar contra Vercel Preview:
 *   BASE_URL=https://nexium-PREVIEW.vercel.app node scripts/test-video-export.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const FLYER_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="nexium:type" content="story">
  <meta name="nexium:duration" content="4">
  <meta name="nexium:fps" content="15">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1920px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }
    .bg {
      position: absolute;
      inset: 0;
      background: #0a0a0f;
      animation: bgShift 4s linear forwards;
    }
    @keyframes bgShift {
      0%   { background: #ff5555; }
      33%  { background: #1B2F6E; }
      66%  { background: #4A7BD9; }
      100% { background: #0a0a0f; }
    }
    .text {
      position: relative;
      color: white;
      font-size: 96px;
      font-weight: 900;
      letter-spacing: -2px;
      animation: textFade 4s linear forwards;
    }
    @keyframes textFade {
      0%   { opacity: 0; transform: scale(0.8); }
      25%  { opacity: 1; transform: scale(1); }
      75%  { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.1); }
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="text">NEXIUM</div>
</body>
</html>`;

async function main() {
  console.log("🎬 Test de export de video");
  console.log(`📡 Endpoint: ${BASE_URL}/api/export/video`);
  console.log("📝 El HTML usa meta tags — la API resuelve config automáticamente");
  console.log("   nexium:type=story | nexium:duration=4 | nexium:fps=15");
  console.log();

  const startTime = Date.now();

  let response;
  try {
    response = await fetch(`${BASE_URL}/api/export/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html: FLYER_HTML,
        filename: `nexium-test-${Date.now()}`,
      }),
    });
  } catch (err) {
    console.error("❌ No se pudo conectar al servidor:", err.message);
    console.error("   Asegúrate de que el dev server esté corriendo: npm run dev");
    process.exit(1);
  }

  const totalMs = Date.now() - startTime;
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    console.error("❌ Error del endpoint:", result.error ?? response.statusText);
    console.error("   Status HTTP:", response.status);
    process.exit(1);
  }

  console.log(`⏱  Tiempo total: ${(totalMs / 1000).toFixed(1)}s`);

  if (contentType.includes("video/mp4")) {
    // Modo local: guardar el binario a disco
    const filename = response.headers.get("x-nexium-filename") ?? `video-${Date.now()}.mp4`;
    const frames = response.headers.get("x-nexium-frames") ?? "?";
    const buf = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filename, buf);

    console.log("✅ Video generado exitosamente (modo local — descarga directa)");
    console.log(`🎞  Frames capturados: ${frames}`);
    console.log(`📦 Guardado como: ${filename} (${(buf.byteLength / 1024).toFixed(0)} KB)`);
    console.log();
    console.log("💡 Abre el archivo con QuickTime o VLC para verificar.");
  } else {
    // Modo Vercel: URL de Blob en JSON
    const result = await response.json();
    if (!result.success) {
      console.error("❌ Error:", result.error);
      process.exit(1);
    }
    console.log("✅ Video generado exitosamente");
    console.log(`🎞  Frames capturados: ${result.framesCaptured}`);
    console.log(`📦 Filename: ${result.filename}`);
    console.log(`🔗 URL: ${result.videoUrl}`);
    console.log();
    console.log("⚙️  Config resuelta:");
    console.log(`   type:     ${result.config.type}`);
    console.log(`   size:     ${result.config.width}×${result.config.height}`);
    console.log(`   duration: ${result.config.durationSeconds}s`);
    console.log(`   fps:      ${result.config.fps}`);
    console.log();
    console.log("💡 Abre la URL en browser para verificar el video.");
  }
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
