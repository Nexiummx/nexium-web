export type PresetType = "story" | "reel" | "square" | "landscape" | "tiktok";

/** Configuración resuelta lista para captureFrames + encodeVideo */
export interface VideoConfig {
  width: number;
  height: number;
  durationSeconds: number;
  fps: number;
  filename: string;
  type: PresetType;
}

/** Body del POST. Todo opcional excepto html. */
export interface VideoExportRequest {
  /** HTML completo del flyer (incluye <html>, <head>, <body>) */
  html: string;
  type?: PresetType;
  durationSeconds?: number;
  fps?: number;
  width?: number;
  height?: number;
  filename?: string;
}

export interface VideoExportResponse {
  success: boolean;
  videoUrl?: string;
  filename?: string;
  durationMs?: number;
  framesCaptured?: number;
  config?: VideoConfig;
  error?: string;
}

export interface CaptureFramesOptions {
  html: string;
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  outputDir: string;
}

export interface EncodeVideoOptions {
  framesDir: string;
  outputPath: string;
  /** FPS final del video de salida */
  fps: number;
  /** FPS al que se capturaron los frames (puede ser menor que fps) */
  captureFps?: number;
  /** Dimensiones finales del video de salida */
  width: number;
  height: number;
}

/** Metadata extraída del HTML antes de aplicar preset */
export interface RawHtmlMetadata {
  type?: string;
  duration?: string;
  fps?: string;
  width?: string;
  height?: string;
  filename?: string;
}
