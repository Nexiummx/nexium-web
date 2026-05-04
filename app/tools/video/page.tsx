"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import styles from "./video.module.css";

/* ── Constantes ─────────────────────────────────────────────────────────── */
const ACCESS_TOKEN = "nexium-slides-2026";

const EXPORT_MSGS = [
  "Iniciando Chromium…",
  "Cargando fuentes y CSS…",
  "Capturando frames…",
  "Capturando frames…",
  "Codificando MP4 con ffmpeg…",
  "Subiendo a Blob storage…",
];

/* ── Utilidades ─────────────────────────────────────────────────────────── */
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Inyecta en el HTML un script de control universal.
 * Detecta automáticamente si el HTML usa GSAP o CSS animations puras:
 *
 * - GSAP (window.tl / window.timeline / etc.) → tl.pause() / tl.seek() / tl.play()
 * - CSS puro → Web Animations API (getAnimations())
 *
 * Ambos modos son completamente transparentes: los botones del panel
 * funcionan igual sin importar qué stack de animación use el HTML.
 */
function injectControlScript(html: string): string {
  const script = `
<script>
(function() {
  /* ── Detectar motor de animación ── */
  var GSAP_NAMES = ['tl', 'videoTimeline', 'timeline', 'masterTl', 'mainTl', 'tl1', 'gsapTl', 'anim'];
  var gsapTl = null;

  function findGsapTl() {
    for (var i = 0; i < GSAP_NAMES.length; i++) {
      var candidate = window[GSAP_NAMES[i]];
      if (candidate && typeof candidate.pause === 'function' && typeof candidate.seek === 'function') {
        return candidate;
      }
    }
    // Fallback: globalTimeline de GSAP
    if (window.gsap && window.gsap.globalTimeline) return window.gsap.globalTimeline;
    return null;
  }

  /* ── Operaciones GSAP ── */
  function gsapPause()   { gsapTl.pause(); }
  function gsapPlay()    { gsapTl.play(); }
  function gsapRestart() { gsapTl.seek(0, false); gsapTl.play(); }
  function gsapSeek(sec) { gsapTl.seek(sec, false); }

  /* ── Operaciones Web Animations API ── */
  function cssAnims() { return document.getAnimations(); }
  function cssPause()   { cssAnims().forEach(function(a){ a.pause(); }); }
  function cssPlay()    { cssAnims().forEach(function(a){ a.play(); }); }
  function cssRestart() { cssAnims().forEach(function(a){ a.cancel(); a.play(); }); }
  function cssSeek(ms)  { cssAnims().forEach(function(a){ a.currentTime = ms; }); }

  /* ── Dispatcher según motor ── */
  function dispatch(cmd, data) {
    if (gsapTl) {
      if (cmd === 'pause')   gsapPause();
      if (cmd === 'play')    gsapPlay();
      if (cmd === 'restart') gsapRestart();
      if (cmd === 'seek')    gsapSeek(data.sec);
    } else {
      if (cmd === 'pause')   cssPause();
      if (cmd === 'play')    cssPlay();
      if (cmd === 'restart') cssRestart();
      if (cmd === 'seek')    cssSeek(data.ms);
    }
  }

  /* ── Escuchar comandos del panel ── */
  window.addEventListener('message', function(e) {
    var cmd = e.data && e.data.nexiumCmd;
    if (!cmd) return;
    dispatch(cmd, e.data);
  });

  /* ── Reportar progreso al panel cada 100ms ── */
  var ticker;
  function startTick() {
    clearInterval(ticker);
    ticker = setInterval(function() {
      var cur = 0, dur = 0;

      if (gsapTl) {
        dur = (gsapTl.duration() || 0) * 1000;
        cur = (gsapTl.time ? gsapTl.time() : 0) * 1000;
      } else {
        var anims = cssAnims();
        anims.forEach(function(a) {
          var d = a.effect ? a.effect.getTiming().duration : 0;
          if (typeof d === 'number' && d > dur) {
            dur = d;
            cur = typeof a.currentTime === 'number' ? a.currentTime : 0;
          }
        });
      }

      window.parent.postMessage({ nexiumProgress: { cur: cur, dur: dur } }, '*');
    }, 100);
  }

  /* ── Inicializar cuando el DOM esté listo ── */
  function init() {
    gsapTl = findGsapTl();
    if (gsapTl) {
      // Si la timeline fue creada con paused:true, arrancarla automáticamente
      if (gsapTl.paused && gsapTl.paused()) gsapTl.play();
    }
    startTick();
    // Re-intentar detectar GSAP si el script se ejecutó después del DOMContentLoaded
    if (!gsapTl) {
      var attempts = [200, 500, 1000, 2000];
      attempts.forEach(function(delay) {
        setTimeout(function() {
          if (!gsapTl) {
            gsapTl = findGsapTl();
            if (gsapTl && gsapTl.paused && gsapTl.paused()) gsapTl.play();
          }
        }, delay);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM ya listo pero GSAP puede no haber ejecutado su script aún
    setTimeout(init, 0);
  }
})();
</script>`;

  // Insertar justo antes de </head> si existe, si no al inicio
  if (html.includes("</head>")) {
    return html.replace("</head>", `${script}\n</head>`);
  }
  return script + html;
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
    <div className={styles.gate}>
      <div className={styles.gateBox}>
        <h2>Nexium Tools</h2>
        <p>Ingresa el token de acceso para continuar.</p>
        <input
          className={styles.gateInput}
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
        {error && <span className={styles.gateError}>{error}</span>}
        <button className={styles.btnPrimary} onClick={submit}>
          Acceder →
        </button>
      </div>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────────────── */
export default function VideoToolPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [html, setHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState(""); // lo que está en el iframe
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ cur: 0, dur: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportMsgIdx, setExportMsgIdx] = useState(0);
  const [error, setError] = useState("");
  const [successUrl, setSuccessUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("nxt_tool_unlocked") === "1") setUnlocked(true);
  }, []);

  // Escuchar progreso del iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.nexiumProgress) {
        setProgress(e.data.nexiumProgress);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // HTML inyectado con script de control
  const augmentedHtml = useMemo(
    () => (previewHtml ? injectControlScript(previewHtml) : ""),
    [previewHtml]
  );

  const sendCmd = (cmd: string, extra?: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage({ nexiumCmd: cmd, ...extra }, "*");
  };

  const handlePreview = useCallback(() => {
    if (!html.trim()) return;
    setPreviewHtml(html);
    setIsPaused(false);
    setProgress({ cur: 0, dur: 0 });
  }, [html]);

  const handlePlay = () => {
    sendCmd("play");
    setIsPaused(false);
  };

  const handlePause = () => {
    sendCmd("pause");
    setIsPaused(true);
  };

  const handleRestart = () => {
    sendCmd("restart");
    setIsPaused(false);
    setProgress({ cur: 0, dur: 0 });
  };

  const handleClear = () => {
    setHtml("");
    setPreviewHtml("");
    setProgress({ cur: 0, dur: 0 });
    setError("");
    textareaRef.current?.focus();
  };

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(""), 6000);
  };

  const showSuccess = (url: string) => {
    setSuccessUrl(url);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessUrl(""), 12000);
  };

  const handleExport = useCallback(async () => {
    if (!html.trim() || exporting) return;
    setExporting(true);
    setExportMsgIdx(0);
    setError("");
    setSuccessUrl("");

    const msgInterval = setInterval(() => {
      setExportMsgIdx((i) => Math.min(i + 1, EXPORT_MSGS.length - 1));
    }, 6000);

    try {
      const res = await fetch("/api/export/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (!res.ok) {
        // Intentar leer el error como JSON
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Error ${res.status}`);
      }

      const contentType = res.headers.get("Content-Type") ?? "";

      if (contentType.includes("video/mp4")) {
        // Modo local: respuesta binaria directa → crear object URL y descargar
        const filename =
          res.headers.get("X-Nexium-Filename") ?? "video.mp4";
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.click();

        // Revocar después de un momento
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
        showSuccess(objectUrl);
      } else {
        // Modo Vercel: respuesta JSON con URL de Blob
        const data = await res.json() as { success: boolean; videoUrl?: string; filename?: string; error?: string };
        if (!data.success) throw new Error(data.error ?? "Error desconocido");

        const a = document.createElement("a");
        a.href = data.videoUrl!;
        a.download = data.filename ?? "video.mp4";
        a.target = "_blank";
        a.click();

        showSuccess(data.videoUrl!);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al exportar el video.");
    } finally {
      clearInterval(msgInterval);
      setExporting(false);
      setExportMsgIdx(0);
    }
  }, [html, exporting]);

  // Dimensiones para el iframe con aspect ratio del preset detectado por meta tag
  const iframeSize = useMemo(() => {
    // Detectar tipo desde los meta tags del HTML
    const typeMatch = html.match(/nexium:type["']\s+content=["']([^"']+)["']/);
    const type = typeMatch?.[1] ?? "story";
    const sizes: Record<string, [number, number]> = {
      story: [1080, 1920],
      reel: [1080, 1920],
      tiktok: [1080, 1920],
      square: [1080, 1080],
      landscape: [1920, 1080],
    };
    return sizes[type] ?? [1080, 1920];
  }, [html]);

  const [iframeW, iframeH] = iframeSize;
  // Escalar para que quepa en el panel con margen
  const maxH = 520;
  const maxW = 480;
  const scale = Math.min(maxW / iframeW, maxH / iframeH, 1);
  const displayW = Math.round(iframeW * scale);
  const displayH = Math.round(iframeH * scale);

  const durationS = progress.dur / 1000;
  const currentS = progress.cur / 1000;
  const progressPct =
    progress.dur > 0 ? Math.min((progress.cur / progress.dur) * 100, 100) : 0;

  if (!unlocked) {
    return (
      <div className={styles.root}>
        <TokenGate onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarTitle}>Nexium · Video Export</span>
          <span className={styles.topbarBadge}>MP4 · H.264</span>
        </div>
        <div className={styles.topbarActions}>
          <button
            className={styles.btnSecondary}
            onClick={handlePreview}
            disabled={!html.trim()}
          >
            ▶ Previsualizar
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleExport}
            disabled={!html.trim() || exporting}
          >
            {exporting ? (
              <>
                <span className={styles.spinner} />
                {EXPORT_MSGS[exportMsgIdx]}
              </>
            ) : (
              "↓ Exportar MP4"
            )}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Panel izquierdo — editor */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>HTML</span>
            {html && (
              <button className={styles.btnDanger} onClick={handleClear}>
                Limpiar
              </button>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder={`Pega aquí tu HTML animado.\n\nEl video se auto-configura con meta tags:\n\n<meta name="nexium:type" content="story">\n<meta name="nexium:duration" content="12">\n<meta name="nexium:fps" content="30">\n\nPresets: story · reel · square · landscape · tiktok`}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className={styles.editorFooter}>
            <button
              className={styles.btnPrimary}
              onClick={handlePreview}
              disabled={!html.trim()}
              style={{ flex: 1 }}
            >
              ▶ Previsualizar
            </button>
            <span className={styles.charCount}>
              {html.length.toLocaleString()} chars
            </span>
          </div>
        </div>

        {/* Panel derecho — preview + controles */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <span>Vista previa</span>
            {previewHtml && (
              <span className={styles.previewMeta}>
                {iframeW}×{iframeH} · {displayW}×{displayH}px (escala {(scale * 100).toFixed(0)}%)
              </span>
            )}
          </div>

          {/* Escenario del iframe */}
          <div className={styles.previewStage}>
            {!previewHtml ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>▷</span>
                <span>Pega tu HTML y presiona Previsualizar</span>
                <span style={{ fontSize: 12 }}>
                  Las animaciones CSS corren en tiempo real
                </span>
              </div>
            ) : (
              <div
                className={styles.iframeWrapper}
                style={{ width: displayW, height: displayH }}
              >
                <iframe
                  ref={iframeRef}
                  className={styles.previewIframe}
                  srcDoc={augmentedHtml}
                  width={iframeW}
                  height={iframeH}
                  style={{
                    width: iframeW,
                    height: iframeH,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                  sandbox="allow-scripts allow-same-origin"
                  title="Video preview"
                />
              </div>
            )}
          </div>

          {/* Controles de reproducción */}
          <div className={styles.controls}>
            <div className={styles.controlsCenter}>
              {/* Reiniciar */}
              <button
                className={styles.controlBtn}
                onClick={handleRestart}
                disabled={!previewHtml}
                title="Reiniciar (R)"
              >
                ⟳
              </button>
              {/* Play / Pausa */}
              {isPaused ? (
                <button
                  className={styles.controlBtn}
                  onClick={handlePlay}
                  disabled={!previewHtml}
                  title="Reproducir (Espacio)"
                >
                  ▶
                </button>
              ) : (
                <button
                  className={`${styles.controlBtn} ${previewHtml ? styles.controlBtnActive : ""}`}
                  onClick={handlePause}
                  disabled={!previewHtml}
                  title="Pausar (Espacio)"
                >
                  ⏸
                </button>
              )}
            </div>

            {/* Barra de progreso */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Tiempo */}
            <span className={styles.timeDisplay}>
              {durationS > 0
                ? `${formatTime(currentS)} / ${formatTime(durationS)}`
                : previewHtml
                  ? "— / —"
                  : "0:00"}
            </span>
          </div>

          {/* Barra de exportación */}
          <div className={styles.exportBar}>
            {exporting ? (
              <span className={styles.exportProgress}>
                <span className={styles.spinner} />
                {EXPORT_MSGS[exportMsgIdx]}
              </span>
            ) : (
              <span className={styles.exportInfo}>
                <span className={styles.exportInfoStrong}>Exportar MP4 </span>
                — captura frames con Chromium headless + ffmpeg H.264.{" "}
                El HTML se auto-configura con meta tags{" "}
                <code style={{ fontSize: 11, opacity: 0.7 }}>nexium:type</code>,{" "}
                <code style={{ fontSize: 11, opacity: 0.7 }}>nexium:duration</code>,{" "}
                <code style={{ fontSize: 11, opacity: 0.7 }}>nexium:fps</code>.
              </span>
            )}
            <button
              className={styles.btnPrimary}
              onClick={handleExport}
              disabled={!html.trim() || exporting}
              style={{ flexShrink: 0 }}
            >
              {exporting ? "Exportando…" : "↓ Exportar MP4"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Toasts ── */}
      {error && (
        <div className={styles.errorToast}>
          ⚠ {error}
        </div>
      )}
      {successUrl && (
        <div className={styles.successToast}>
          ✓ Video generado.{" "}
          <a
            href={successUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            Abrir en browser
          </a>
        </div>
      )}
    </div>
  );
}
