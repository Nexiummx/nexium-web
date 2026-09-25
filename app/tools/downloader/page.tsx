"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import shared from "../video/video.module.css";
import styles from "./downloader.module.css";
import type {
  DownloadQuality,
  DownloadResponse,
  VideoInfo,
} from "@/lib/downloader/types";

/* ── Constantes ─────────────────────────────────────────────────────────── */
const ACCESS_TOKEN = "nexium-slides-2026";

const QUALITY_LABELS: Record<DownloadQuality, string> = {
  best: "Máxima",
  "1080": "1080p",
  "720": "720p",
  "480": "480p",
  audio: "Solo audio (MP3)",
};

const QUALITY_ORDER: DownloadQuality[] = ["best", "1080", "720", "480", "audio"];

/* ── Utilidades ─────────────────────────────────────────────────────────── */
function formatDuration(s: number | null): string {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mmss = `${m.toString().padStart(h ? 2 : 1, "0")}:${sec.toString().padStart(2, "0")}`;
  return h ? `${h}:${mmss}` : mmss;
}

/** Una resolución fija solo se ofrece si el video tiene al menos esa altura */
function isQualityAvailable(q: DownloadQuality, heights: number[]): boolean {
  if (q === "best" || q === "audio" || heights.length === 0) return true;
  return heights[0] >= Number(q);
}

/* ── Gate de acceso ─────────────────────────────────────────────────────── */
function TokenGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (input.trim() === ACCESS_TOKEN) {
      sessionStorage.setItem("nxt_tool_unlocked", "1");
      onUnlock();
    } else {
      setError("Token incorrecto.");
    }
  };

  return (
    <div className={shared.gate}>
      <div className={shared.gateBox}>
        <h2>Nexium Tools</h2>
        <p>Ingresa el token de acceso para continuar.</p>
        <input
          className={shared.gateInput}
          type="password"
          placeholder="Token de acceso"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {error && <span className={shared.gateError}>{error}</span>}
        <button className={shared.btnPrimary} onClick={submit}>
          Acceder →
        </button>
      </div>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────────────── */
export default function DownloaderToolPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [quality, setQuality] = useState<DownloadQuality>("best");
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("nxt_tool_unlocked") === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(""), 7000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(""), 10000);
  };

  /** Maneja respuestas de error de la API (incluye yt-dlp no instalado) */
  const handleApiError = async (res: Response) => {
    const data = (await res.json().catch(() => ({}))) as DownloadResponse;
    if (data.code === "YTDLP_MISSING") {
      setShowSetupModal(true);
      return;
    }
    showError(data.error ?? `Error ${res.status}`);
  };

  const handleAnalyze = useCallback(async () => {
    if (!url.trim() || analyzing) return;
    setAnalyzing(true);
    setInfo(null);
    setError("");
    try {
      const res = await fetch("/api/download/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return await handleApiError(res);
      const data = (await res.json()) as DownloadResponse;
      if (data.info) {
        setInfo(data.info);
        setQuality("best");
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo analizar la URL.");
    } finally {
      setAnalyzing(false);
    }
  }, [url, analyzing]);

  const handleDownload = useCallback(async () => {
    if (!info || downloading) return;
    setDownloading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/download/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: info.webpageUrl || url, quality }),
      });
      if (!res.ok) return await handleApiError(res);

      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        // Vercel: el archivo se subió a Blob
        const data = (await res.json()) as DownloadResponse;
        if (!data.success || !data.fileUrl) throw new Error(data.error ?? "Error desconocido");
        const a = document.createElement("a");
        a.href = data.fileUrl;
        a.download = data.filename ?? "video";
        a.target = "_blank";
        a.click();
        showSuccess(`✓ Listo: ${data.filename}`);
      } else {
        // Local: el archivo viene directo en la respuesta
        const filename = res.headers.get("X-Nexium-Filename") ?? "video.mp4";
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
        showSuccess(`✓ Descargado: ${filename}`);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al descargar.");
    } finally {
      setDownloading(false);
    }
  }, [info, url, quality, downloading]);

  const handleClear = () => {
    setUrl("");
    setInfo(null);
    setError("");
  };

  if (!unlocked) {
    return (
      <div className={shared.root}>
        <TokenGate onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  return (
    <div className={shared.root}>
      {/* ── Topbar ── */}
      <header className={shared.topbar}>
        <div className={shared.topbarLeft}>
          <span className={shared.topbarTitle}>Nexium · Video Downloader</span>
          <span className={shared.topbarBadge}>MP4 · MP3</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Descargar video</h1>
          <p>
            Pega el link de YouTube, TikTok, Instagram, Facebook, X, Vimeo y cientos de sitios
            más. Analiza el video, elige la calidad y descárgalo.
          </p>
        </div>

        {/* ── URL ── */}
        <div className={styles.urlRow}>
          <input
            className={styles.urlInput}
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (info) setInfo(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            autoFocus
          />
          <button
            className={shared.btnPrimary}
            onClick={handleAnalyze}
            disabled={!url.trim() || analyzing}
          >
            {analyzing ? <><span className={shared.spinner} />Analizando…</> : "Analizar"}
          </button>
          {url && (
            <button className={shared.btnDanger} onClick={handleClear}>
              Limpiar
            </button>
          )}
        </div>

        {/* ── Resultado ── */}
        {info && (
          <div className={styles.card}>
            {info.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.thumb}
                src={info.thumbnail}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.thumb} />
            )}
            <div className={styles.cardBody}>
              <div>
                <h2 className={styles.title}>{info.title}</h2>
                <div className={styles.meta}>
                  <span className={styles.platform}>{info.platform}</span>
                  {info.uploader && <span>{info.uploader}</span>}
                  {info.durationSeconds ? <span>{formatDuration(info.durationSeconds)}</span> : null}
                  {info.heights[0] ? <span>Hasta {info.heights[0]}p</span> : null}
                </div>
              </div>

              <div className={styles.qualities}>
                {QUALITY_ORDER.map((q) => (
                  <button
                    key={q}
                    className={`${styles.quality} ${quality === q ? styles.qualityActive : ""}`}
                    onClick={() => setQuality(q)}
                    disabled={!isQualityAvailable(q, info.heights) || downloading}
                  >
                    {QUALITY_LABELS[q]}
                  </button>
                ))}
              </div>

              <div className={styles.actions}>
                <button
                  className={shared.btnPrimary}
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <><span className={shared.spinner} />Descargando…</>
                  ) : quality === "audio" ? "↓ Descargar MP3" : "↓ Descargar MP4"}
                </button>
                {downloading && (
                  <span className={styles.hint}>
                    Puede tardar según el tamaño del video.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <p className={styles.notice}>
          Usa esta herramienta solo con contenido propio, de clientes que lo autoricen o con
          licencia que permita descargarlo. Respeta los derechos de autor y los términos de cada
          plataforma. Límite: 500 MB por archivo.
        </p>
      </main>

      {/* ── Toasts ── */}
      {error && <div className={shared.errorToast}>⚠ {error}</div>}
      {successMsg && <div className={shared.successToast}>{successMsg}</div>}

      {/* ── Modal: yt-dlp no instalado ── */}
      {showSetupModal && (
        <div className={shared.modalOverlay} onClick={() => setShowSetupModal(false)}>
          <div className={shared.modal} onClick={(e) => e.stopPropagation()}>
            <div className={shared.modalHeader}>
              <span>Falta instalar yt-dlp</span>
              <button className={shared.modalClose} onClick={() => setShowSetupModal(false)}>
                ✕
              </button>
            </div>
            <div className={shared.modalBody}>
              <p className={shared.modalText}>
                El descargador usa <strong>yt-dlp</strong>, que no está disponible en este
                servidor. Instálalo una vez en la raíz del proyecto:
              </p>
              <pre className={shared.codeBlock}>npm run setup:downloader</pre>
              <p className={shared.modalNote}>
                Descarga el binario en <code className={shared.inlineCode}>bin/yt-dlp</code> (no
                requiere Python). También puedes usar un yt-dlp ya instalado definiendo{" "}
                <code className={shared.inlineCode}>YTDLP_PATH</code>. Vuelve a correr el comando
                si alguna plataforma deja de funcionar: yt-dlp se actualiza seguido.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
