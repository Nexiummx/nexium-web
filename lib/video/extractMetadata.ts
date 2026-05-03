import type {
  PresetType,
  RawHtmlMetadata,
  VideoConfig,
  VideoExportRequest,
} from "./types";
import { getPreset, isValidPresetType } from "./presets";
import { HARD_DEFAULT_TYPE } from "./config";

/**
 * Extrae meta tags `nexium:*` del HTML usando regex (no requiere parser DOM).
 * Se ejecuta antes de Puppeteer para resolver la config sin abrir un browser.
 */
export function extractRawMetadata(html: string): RawHtmlMetadata {
  const metadata: RawHtmlMetadata = {};
  const metaRegex =
    /<meta\s+name=["']nexium:([^"']+)["']\s+content=["']([^"']+)["']\s*\/?>/gi;

  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2];

    switch (key) {
      case "type":
        metadata.type = value;
        break;
      case "duration":
        metadata.duration = value;
        break;
      case "fps":
        metadata.fps = value;
        break;
      case "width":
        metadata.width = value;
        break;
      case "height":
        metadata.height = value;
        break;
      case "filename":
        metadata.filename = value;
        break;
    }
  }

  return metadata;
}

/**
 * Resuelve la configuración final aplicando precedencia:
 * 1. Body del POST (mayor)
 * 2. Meta tags del HTML
 * 3. Preset según type
 * 4. Hard default (story)
 */
export function resolveVideoConfig(
  request: VideoExportRequest,
  rawMetadata: RawHtmlMetadata
): VideoConfig {
  let type: PresetType = HARD_DEFAULT_TYPE;
  if (rawMetadata.type && isValidPresetType(rawMetadata.type)) {
    type = rawMetadata.type;
  }
  if (request.type && isValidPresetType(request.type)) {
    type = request.type;
  }

  const preset = getPreset(type);

  const durationSeconds =
    request.durationSeconds ??
    parseFloatSafe(rawMetadata.duration) ??
    preset.durationSeconds;

  const fps = request.fps ?? parseIntSafe(rawMetadata.fps) ?? preset.fps;

  const width = request.width ?? parseIntSafe(rawMetadata.width) ?? preset.width;

  const height =
    request.height ?? parseIntSafe(rawMetadata.height) ?? preset.height;

  const filename =
    request.filename ?? rawMetadata.filename ?? `flyer-${Date.now()}`;

  return {
    type,
    width,
    height,
    durationSeconds,
    fps,
    filename,
  };
}

function parseIntSafe(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFloatSafe(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
