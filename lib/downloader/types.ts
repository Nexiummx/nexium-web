/** Calidades que ofrece el panel. "audio" extrae solo el audio en MP3. */
export type DownloadQuality = "best" | "1080" | "720" | "480" | "audio";

export const DOWNLOAD_QUALITIES: DownloadQuality[] = [
  "best",
  "1080",
  "720",
  "480",
  "audio",
];

/** Resumen de metadatos que devuelve /api/download/info */
export interface VideoInfo {
  id: string;
  title: string;
  uploader: string | null;
  platform: string;
  durationSeconds: number | null;
  thumbnail: string | null;
  webpageUrl: string;
  /** Alturas de video disponibles (desc), p. ej. [2160, 1080, 720] */
  heights: number[];
}

export interface DownloadRequest {
  url: string;
  quality?: DownloadQuality;
}

export interface DownloadResponse {
  success: boolean;
  fileUrl?: string;
  filename?: string;
  error?: string;
  /** "YTDLP_MISSING" cuando el binario no está instalado en el servidor */
  code?: string;
  info?: VideoInfo;
}
