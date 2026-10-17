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
  detail?: string;
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface UploadRequest {
  code?: unknown;
  /** Token del celular ligado por QR (en lugar del código de acceso) */
  token?: unknown;
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

/** Quita espacios, saltos de línea y comillas que se cuelan al pegar en Vercel. */
function clean(v: string | undefined): string {
  return (v || "").trim().replace(/^["']|["']$/g, "").trim();
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const url = clean(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
  const key = clean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY);
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

/** Qué tipo de llave hay en Vercel, sin exponerla: la pública (publishable
 *  o anon) en lugar de la secreta es el error más común. */
export type KeyKind = "secret" | "service_role" | "publishable" | "anon" | "desconocida";
export function keyKind(key: string): KeyKind {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  const parts = key.split(".");
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role;
      if (role === "service_role" || role === "anon") return role;
    } catch {
      /* no es un JWT legible */
    }
  }
  return "desconocida";
}

/** Mensaje corto de Supabase para el diagnóstico (nunca incluye la llave). */
async function detailOf(r: Response): Promise<string> {
  const text = await r.text().catch(() => "");
  try {
    const j = JSON.parse(text) as { message?: string; msg?: string; error?: string; hint?: string };
    return String(j.message || j.msg || j.error || j.hint || text).slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
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
  const detail = await detailOf(r);
  if (/codigo_invalido/.test(detail)) throw new StarmodaError("codigo_invalido", 403);
  const e = new StarmodaError(`supabase_${r.status}`, 502);
  e.detail = detail;
  throw e;
}

/** Valida un código de acceso con la base (lanza codigo_invalido si no sirve). */
export async function validateAccessCode(code: unknown, cfg: Config = getConfig()): Promise<void> {
  await checkCode(cfg, code);
}

export interface SetupStatus {
  /** El servidor tiene SUPABASE_URL y la llave secreta */
  config: boolean;
  /** El código existe y está activo (null: no se pudo revisar) */
  code: boolean | null;
  /** El bucket de fotos existe y es público (null: no se pudo revisar) */
  bucket: boolean | null;
  error?: string;
  /** Lo que respondió Supabase cuando algo falló */
  detail?: string;
  /** Tipo de llave configurada en Vercel */
  keyKind?: KeyKind;
  /** Proyecto al que apunta Vercel (p. ej. wxcmlfxcaunvtcegyupc) */
  project?: string;
  /** Hay llave de IA para leer etiquetas con la cámara */
  vision?: boolean;
}

/** Diagnóstico para la pantalla de conexión de la app: nunca lanza. */
export async function checkSetup(
  code: unknown,
  env: NodeJS.ProcessEnv = process.env
): Promise<SetupStatus> {
  let cfg: Config;
  try {
    cfg = getConfig(env);
  } catch {
    return { config: false, code: null, bucket: null, error: "storage_no_configurado" };
  }
  const out: SetupStatus = {
    vision: !!(env.ANTHROPIC_API_KEY || "").trim(),
    config: true,
    code: null,
    bucket: null,
    keyKind: keyKind(cfg.key),
    project: /^https:\/\/([a-z0-9]+)\.supabase\.co$/.exec(cfg.url)?.[1] || cfg.url.replace(/^https?:\/\//, ""),
  };
  try {
    await checkCode(cfg, code);
    out.code = true;
  } catch (e) {
    if (e instanceof StarmodaError && e.message === "codigo_invalido") out.code = false;
    else {
      out.error = e instanceof Error ? e.message : "error";
      if (e instanceof StarmodaError && e.detail) out.detail = e.detail;
    }
  }
  try {
    const r = await fetch(`${cfg.url}/storage/v1/bucket/${BUCKET}`, { headers: headers(cfg.key) });
    if (r.ok) {
      const b = (await r.json()) as { public?: boolean };
      out.bucket = b.public === true;
    } else if (r.status === 400 || r.status === 404) {
      out.bucket = false;
    } else {
      const detail = await detailOf(r);
      if (!out.error) {
        out.error = `storage_${r.status}`;
        out.detail = detail;
      }
    }
  } catch (e) {
    out.error = out.error || (e instanceof Error ? e.message : "error");
  }
  return out;
}

/** Carpeta de las fotos que manda un celular: cel<token>. */
export function phoneFolder(token: unknown): string {
  if (typeof token !== "string" || !/^[a-f0-9]{24}$/.test(token)) {
    throw new StarmodaError("sesion_vencida", 403);
  }
  return `cel${token}`;
}

/** El celular no conoce el código de acceso: se valida su enlace del QR. */
async function checkPhoneToken(cfg: Config, token: string): Promise<void> {
  const r = await fetch(`${cfg.url}/rest/v1/rpc/starmoda_scan_valida`, {
    method: "POST",
    headers: headers(cfg.key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ p_token: token }),
  });
  if (!r.ok) {
    const e = new StarmodaError(`supabase_${r.status}`, 502);
    e.detail = await detailOf(r);
    throw e;
  }
  if ((await r.json()) !== true) throw new StarmodaError("sesion_vencida", 403);
}

export async function createUploadTicket(
  body: UploadRequest,
  cfg: Config = getConfig()
): Promise<UploadTicket> {
  let path: string;
  if (body.token !== undefined) {
    path = buildPath(phoneFolder(body.token), body.fileName);
    await checkPhoneToken(cfg, body.token as string);
  } else {
    path = buildPath(body.productId, body.fileName);
    await checkCode(cfg, body.code);
  }

  const r = await fetch(`${cfg.url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(cfg.key, { "x-upsert": "true" }),
  });
  if (!r.ok) {
    const e = new StarmodaError(`storage_${r.status}`, 502);
    e.detail = await detailOf(r);
    throw e;
  }
  const data = (await r.json()) as { url?: string };
  if (!data.url) throw new StarmodaError("storage_sin_url", 502);

  return {
    path,
    uploadUrl: `${cfg.url}/storage/v1${data.url}`,
    publicUrl: `${cfg.url}/storage/v1/object/public/${BUCKET}/${path}`,
  };
}
