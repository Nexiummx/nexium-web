/**
 * Inserta o reemplaza un <meta name="nexium:…" content="…" /> en el HTML.
 * Pensado para duración / FPS editados desde la herramienta de video.
 */
export function setNexiumMetaContent(
  html: string,
  name: "duration" | "fps" | "type" | "filename",
  content: string
): string {
  const fullName = `nexium:${name}`;
  const safe = content
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  const tag = `<meta name="${fullName}" content="${safe}" />`;
  const re = new RegExp(
    `<meta\\s+name=["']${fullName}["']\\s+content=["'][^"']*["']\\s*\\/?>`,
    "i"
  );
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `    ${tag}\n</head>`);
  }
  return `<head>\n    ${tag}\n</head>\n${html}`;
}
