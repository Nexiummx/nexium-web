/** Huella ligera del HTML para emparejar overrides guardados. */
export function fingerprintHtml(html: string): string {
  let h = 5381;
  for (let i = 0; i < html.length; i++) {
    h = (h * 33) ^ html.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}
