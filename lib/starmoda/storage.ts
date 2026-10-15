/**
 * Star Moda: subida de fotos a Supabase Storage.
 *
 * El navegador nunca ve la llave secreta. Pide aquí una URL firmada
 * (válida para un solo archivo) mandando su código de acceso; el código se
 * valida con la función starmoda_quien de la base, y luego el navegador
 * sube la foto directo a Supabase con esa URL.
 */

export const BUCKET = "starmoda-fotos";
const EXTS: Record<string, string> = {
  jpg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
};

export class StarmodaError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface UploadRequest {
  code?: unknown;
  productId?: unknown;
  fileName?: unknown;
}

export interface UploadTicket {
  path: string;
  uploadUrl: string;
  publicUrl: string;
}

interface Config {
  url: string;
  key: string;
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const url = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "";
  if (!url || !key) throw new StarmodaError("storage_no_configurado", 501);
  return { url, key };
}

/** Arma la ruta del archivo en el bucket: <prenda>/<nombre>.<ext>. Solo
 *  minúsculas, números y guiones, para que no se pueda salir de la carpeta. */
export function buildPath(productId: unknown, fileName: unknown): string {
  if (typeof productId !== "string" || !/^[a-z0-9]{4,40}$/.test(productId)) {
    throw new StarmodaError("prenda_invalida", 400);
  }
  if (typeof fileName !== "string") throw new StarmodaError("archivo_invalido", 400);
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.([a-z]+)$/.exec(fileName);
  if (!m || m[1].length > 120 || !EXTS[m[2]]) {
    throw new StarmodaError("archivo_invalido", 400);
  }
  return `${productId}/${m[1]}.${m[2]}`;
}

function headers(key: string, extra?: Record<string, string>): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

async function checkCode(cfg: Config, code: unknown): Promise<void> {
  if (typeof code !== "string" || !code.trim() || code.length > 200) {
    throw new StarmodaError("codigo_invalido", 403);
  }
  const r = await fetch(`${cfg.url}/rest/v1/rpc/starmoda_quien`, {
    method: "POST",
    headers: headers(cfg.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ p_code: code }),
  });
  if (r.ok) return;
  const text = await r.text();
  if (/codigo_invalido/.test(text)) throw new StarmodaError("codigo_invalido", 403);
  throw new StarmodaError(`supabase_${r.status}`, 502);
}

export async function createUploadTicket(
  body: UploadRequest,
  cfg: Config = getConfig()
): Promise<UploadTicket> {
  const path = buildPath(body.productId, body.fileName);
  await checkCode(cfg, body.code);

  const r = await fetch(`${cfg.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(cfg.key, { "x-upsert": "true" }),
  });
  if (!r.ok) throw new StarmodaError(`storage_${r.status}`, 502);
  const data = (await r.json()) as { url?: string };
  if (!data.url) throw new StarmodaError("storage_sin_url", 502);

  return {
    path,
    uploadUrl: `${cfg.url}/storage/v1${data.url}`,
    publicUrl: `${cfg.url}/storage/v1/object/public/${BUCKET}/${path}`,
  };
}
