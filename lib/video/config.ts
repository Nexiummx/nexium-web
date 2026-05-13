export const VIDEO_LIMITS = {
  MIN_DURATION_SECONDS: 1,
  MAX_DURATION_SECONDS: 180,
  MIN_FPS: 15,
  MAX_FPS: 60,
  MIN_DIMENSION: 240,
  MAX_DIMENSION: 2160,
} as const;

export const VIDEO_QUALITY = {
  /** CRF para H.264. 18 = visualmente lossless, 23 = default, 28 = alta compresión */
  CRF: 18,
  /** slow ofrece buena compresión sin sacrificar demasiado tiempo */
  PRESET: "slow" as const,
  /** Pixel format compatible con todos los players */
  PIX_FMT: "yuv420p" as const,
} as const;

/** Hard default cuando no hay nada especificado */
export const HARD_DEFAULT_TYPE = "story" as const;
