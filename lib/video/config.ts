export const VIDEO_LIMITS = {
  MIN_DURATION_SECONDS: 1,
  MAX_DURATION_SECONDS: 30,
  MIN_FPS: 15,
  MAX_FPS: 60,
  MIN_DIMENSION: 240,
  MAX_DIMENSION: 2160,
} as const;

export const VIDEO_QUALITY = {
  /** CRF para H.264. 18 = visualmente lossless, 23 = default, 28 = alta compresión */
  CRF: 23,
  /**
   * ultrafast: encode ~10x más rápido que medium. En serverless es esencial.
   * La calidad visual no cambia (controlada por CRF), solo el tamaño del archivo
   * es un poco mayor. Para redes sociales con recompresión igual es suficiente.
   */
  PRESET: "ultrafast" as const,
  /** Pixel format compatible con todos los players */
  PIX_FMT: "yuv420p" as const,
} as const;

/**
 * FPS de captura en Puppeteer (siempre menor o igual al FPS del video).
 * FFmpeg interpola al FPS final. A 10fps de captura se hacen 4x menos
 * screenshots que a 30fps, lo cual es la mayor fuente de latencia en serverless.
 */
export const CAPTURE_FPS = 10;

/**
 * Factor de escala de resolución en Vercel serverless.
 * 0.5 = la mitad del ancho/alto → 4x menos píxeles por screenshot.
 * FFmpeg reescala al tamaño final al encodear.
 */
export const SERVERLESS_SCALE = 0.5;

/** Hard default cuando no hay nada especificado */
export const HARD_DEFAULT_TYPE = "story" as const;
