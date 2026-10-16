/**
 * Star Moda: lectura de etiquetas de proveedor con IA de visión.
 *
 * Recibe la foto de una etiqueta (por ejemplo la de Balam Denim:
 * STYLE/ESTILO, COLOR, SIZE/TALLA y el código de barras) y regresa esos
 * campos como texto, tal como vienen impresos. La app decide después a qué
 * prenda, color y talla corresponden y valida el dígito del código.
 */
import Anthropic from "@anthropic-ai/sdk";
import { StarmodaError } from "./storage";

export interface TagReading {
  /** Dígitos impresos bajo el código de barras ("" si no se ve) */
  barcode: string;
  /** Estilo o modelo del proveedor, p. ej. "BL7571" */
  style: string;
  /** Color tal como viene impreso, p. ej. "MEDIUM MEDIO" */
  color: string;
  /** Talla tal como viene impresa, p. ej. "7 (28)" */
  size: string;
  /** Marca o proveedor si aparece, p. ej. "Balam Denim" */
  brand: string;
  /** Modelo que hizo la lectura (Haiku primero; Opus solo si hizo falta) */
  model?: string;
}

/** Modelos: el rápido y barato primero; el más capaz solo si la lectura del
 *  primero no pasa la validación (código con dígito incorrecto, sin estilo). */
export const PRIMARY_MODEL = "claude-haiku-5-5";
export const FALLBACK_MODEL = "claude-opus-5-5";

/** Dígito verificador de EAN-8 / UPC-A / EAN-13 / GTIN-14 (pesos 3 y 1). */
export function gtinOk(code: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false;
  const d = code.split("").map(Number);
  const check = d.pop() as number;
  const sum = d.reverse().reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** ¿La lectura sirve tal cual? Si no, vale la pena el modelo más capaz. */
export function readingLooksGood(r: TagReading): boolean {
  return !!r.style && (!r.barcode || gtinOk(r.barcode));
}

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];
const MAX_BASE64 = 5 * 1024 * 1024;

const SCHEMA = {
  type: "object",
  properties: {
    barcode: { type: "string", description: "Solo los dígitos impresos bajo el código de barras" },
    style: { type: "string" },
    color: { type: "string" },
    size: { type: "string" },
    brand: { type: "string" },
  },
  required: ["barcode", "style", "color", "size", "brand"],
  additionalProperties: false,
} as const;

const PROMPT = `Esta es la foto de la etiqueta colgante de una prenda.
Transcribe exactamente lo que está impreso, sin traducir ni corregir:
- barcode: solo los dígitos que aparecen debajo del código de barras.
- style: el estilo o modelo (campo STYLE / ESTILO / MODELO / REF).
- color: el color tal como aparece; si viene en dos idiomas, ponlos juntos ("MEDIUM MEDIO").
- size: la talla tal como aparece, con paréntesis si los tiene ("7 (28)").
- brand: la marca si aparece (por ejemplo por el sitio web impreso).
Si un campo no se ve o no existe, deja la cadena vacía. No inventes valores.`;

/** Separa un data URL ("data:image/jpeg;base64,...") en tipo y datos. */
export function parseImage(dataUrl: unknown): { mediaType: MediaType; data: string } {
  if (typeof dataUrl !== "string") throw new StarmodaError("imagen_invalida", 400);
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || !(MEDIA_TYPES as readonly string[]).includes(m[1])) {
    throw new StarmodaError("imagen_invalida", 400);
  }
  if (m[2].length > MAX_BASE64) throw new StarmodaError("imagen_muy_grande", 413);
  return { mediaType: m[1] as MediaType, data: m[2] };
}

function clean(v: unknown, max = 60): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

type Image = { mediaType: MediaType; data: string };

function content(image: Image): Anthropic.Beta.BetaContentBlockParam[] {
  return [
    { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
    { type: "text", text: PROMPT },
  ];
}

async function readWithHaiku(image: Image, client: Anthropic): Promise<TagReading> {
  const response = await client.beta.messages.create({
    model: PRIMARY_MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: content(image) }],
  });
  return parseReading(response, PRIMARY_MODEL);
}

async function readWithOpus(image: Image, client: Anthropic): Promise<TagReading> {
  const response = await client.beta.messages.create({
    model: FALLBACK_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: content(image) }],
  });
  return parseReading(response, FALLBACK_MODEL);
}

/** Haiku primero (centavos de centavo); si falla o su lectura no pasa la
 *  validación, se reintenta una sola vez con Opus. */
export async function readTag(image: Image, client: Anthropic = new Anthropic()): Promise<TagReading> {
  let first: TagReading | null = null;
  try {
    first = await readWithHaiku(image, client);
    if (readingLooksGood(first)) return first;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.RateLimitError) throw e;
  }
  try {
    return await readWithOpus(image, client);
  } catch (e) {
    if (first) return first;
    throw e;
  }
}

function parseReading(response: Anthropic.Beta.BetaMessage, model: string): TagReading {
  if (response.stop_reason === "refusal") throw new StarmodaError("lectura_rechazada", 422);
  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new StarmodaError("lectura_ilegible", 502);
  }
  return {
    barcode: clean(raw.barcode, 20).replace(/\D/g, ""),
    style: clean(raw.style, 40),
    color: clean(raw.color),
    size: clean(raw.size, 30),
    brand: clean(raw.brand),
    model,
  };
}
