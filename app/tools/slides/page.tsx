"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./slides.module.css";

/* ── Constantes ─────────────────────────────────────────────────────────── */
// Mismo valor que TOOL_TOKEN en app/api/render-slides/route.ts
const ACCESS_TOKEN = "nexium-slides-2026";
const SLIDE_W = 1080;
const SLIDE_H = 1350;
const PREVIEW_SCALE = 0.38;

/* ── Tipos ───────────────────────────────────────────────────────────────── */
interface SlideData {
  index: number;
  dataUrl: string; // PNG o JPG base64 data URL
}

/* ── Llamada a la API de render ─────────────────────────────────────────── */
async function renderViaApi(
  html: string,
  onUnauthorized: () => void
): Promise<SlideData[]> {
  const res = await fetch("/api/render-slides", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nexium-token": ACCESS_TOKEN,
    },
    body: JSON.stringify({ html, format: "png" }),
  });

  if (res.status === 401) {
    // Token inválido — cerrar sesión y volver al gate
    sessionStorage.removeItem("nxt_tool_unlocked");
    onUnauthorized();
    throw new Error("Sesión expirada. Ingresa el token nuevamente.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Error ${res.status}`);
  }

  const { slides } = await res.json();
  return slides as SlideData[];
}

/* ── Componente SlideCard ────────────────────────────────────────────────── */
function SlideCard({ slide }: { slide: SlideData }) {
  const n = String(slide.index + 1).padStart(2, "0");

  const downloadPng = () => {
    const a = document.createElement("a");
    a.href = slide.dataUrl;
    a.download = `slide-${n}.png`;
    a.click();
  };

  const downloadJpg = () => {
    const canvas = document.createElement("canvas");
    canvas.width = SLIDE_W;
    canvas.height = SLIDE_H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0D0D0D";
    ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg", 0.95);
      a.download = `slide-${n}.jpg`;
      a.click();
    };
    img.src = slide.dataUrl;
  };

  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [SLIDE_W, SLIDE_H],
      hotfixes: ["px_scaling"],
    });
    pdf.addImage(slide.dataUrl, "PNG", 0, 0, SLIDE_W, SLIDE_H);
    pdf.save(`slide-${n}.pdf`);
  };

  return (
    <div className={styles.slideCard}>
      <div className={styles.slideLabel}>Slide {slide.index + 1}</div>
      <div className={styles.slidePreviewWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.slidePreviewImg}
          src={slide.dataUrl}
          alt={`Slide ${slide.index + 1}`}
          width={Math.round(SLIDE_W * PREVIEW_SCALE)}
          height={Math.round(SLIDE_H * PREVIEW_SCALE)}
        />
      </div>
      <div className={styles.slideActions}>
        <button className={styles.dlBtn} onClick={downloadPng}>
          ↓ PNG
        </button>
        <button className={styles.dlBtn} onClick={downloadJpg}>
          ↓ JPG
        </button>
        <button className={styles.dlBtn} onClick={downloadPdf}>
          ↓ PDF (este slide)
        </button>
      </div>
    </div>
  );
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
export default function SlidesToolPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [html, setHtml] = useState("");
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [rendering, setRendering] = useState(false);
  const [renderMsg, setRenderMsg] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("nxt_tool_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  const handleRender = useCallback(async () => {
    if (!html.trim()) return;
    setRendering(true);
    setError("");
    setSlides([]);
    setRenderMsg("Iniciando Chromium…");

    const msgs = [
      "Cargando fuentes y CSS…",
      "Renderizando slides…",
      "Capturando imágenes…",
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setRenderMsg(msgs[msgIdx]);
    }, 2500);

    try {
      const result = await renderViaApi(html, () => setUnlocked(false));
      setSlides(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al renderizar.");
    } finally {
      clearInterval(msgInterval);
      setRendering(false);
      setRenderMsg("");
    }
  }, [html]);

  const handleClear = () => {
    setHtml("");
    setSlides([]);
    setError("");
    textareaRef.current?.focus();
  };

  const downloadAllPng = () => {
    slides.forEach((slide) => {
      const n = String(slide.index + 1).padStart(2, "0");
      const a = document.createElement("a");
      a.href = slide.dataUrl;
      a.download = `slide-${n}.png`;
      a.click();
    });
  };

  const downloadAllJpg = () => {
    slides.forEach((slide) => {
      const n = String(slide.index + 1).padStart(2, "0");
      const canvas = document.createElement("canvas");
      canvas.width = SLIDE_W;
      canvas.height = SLIDE_H;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0D0D0D";
      ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/jpeg", 0.95);
        a.download = `slide-${n}.jpg`;
        a.click();
      };
      img.src = slide.dataUrl;
    });
  };

  const downloadAllPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [SLIDE_W, SLIDE_H],
      hotfixes: ["px_scaling"],
    });
    slides.forEach((slide, i) => {
      if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], "portrait");
      pdf.addImage(slide.dataUrl, "PNG", 0, 0, SLIDE_W, SLIDE_H);
    });
    pdf.save("slides-nexium.pdf");
  };

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
        <span className={styles.topbarTitle}>Nexium · Slides → PNG</span>
        <div className={styles.topbarActions}>
          {slides.length > 0 && (
            <>
              <button className={styles.btnSecondary} onClick={downloadAllPng}>
                ↓ Todos PNG
              </button>
              <button className={styles.btnSecondary} onClick={downloadAllJpg}>
                ↓ Todos JPG
              </button>
              <button className={styles.btnSecondary} onClick={downloadAllPdf}>
                ↓ PDF completo
              </button>
            </>
          )}
          <button
            className={styles.btnPrimary}
            onClick={handleRender}
            disabled={!html.trim() || rendering}
          >
            {rendering ? "Renderizando…" : "Renderizar ▶"}
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
            placeholder={`Pega aquí tu HTML completo.\n\nEl motor detecta todos los elementos con clase ".post" y los convierte en imágenes pixel-perfect (Chromium headless).\n\nEjemplo:\n<div class="post s4">...</div>\n<div class="post s4">...</div>`}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className={styles.editorFooter}>
            <button
              className={styles.btnPrimary}
              onClick={handleRender}
              disabled={!html.trim() || rendering}
              style={{ width: "100%" }}
            >
              {rendering ? "Renderizando…" : "Renderizar ▶"}
            </button>
            <span className={styles.charCount}>
              {html.length.toLocaleString()} chars
            </span>
          </div>
        </div>

        {/* Panel derecho — preview */}
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <span>Vista previa</span>
            {slides.length > 0 && (
              <span className={styles.slideCount}>
                {slides.length} slide{slides.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className={styles.previewScroll}>
            {rendering && (
              <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>{renderMsg || "Renderizando…"}</span>
                <span style={{ fontSize: 12, opacity: 0.5 }}>
                  Chromium headless · pixel-perfect · ~10–20s
                </span>
              </div>
            )}

            {!rendering && error && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>⚠</span>
                <span style={{ color: "#ff5555" }}>{error}</span>
              </div>
            )}

            {!rendering && !error && slides.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>⬚</span>
                <span>Pega tu HTML y presiona Renderizar</span>
                <span style={{ fontSize: 12 }}>
                  Cada .post → imagen 1080×1350 pixel-perfect
                </span>
              </div>
            )}

            {!rendering &&
              slides.map((slide) => (
                <SlideCard key={slide.index} slide={slide} />
              ))}
          </div>

          {slides.length > 1 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkLabel}>
                {slides.length} slides listos
              </span>
              <button className={styles.btnSecondary} onClick={downloadAllPng}>
                ↓ Todos PNG
              </button>
              <button className={styles.btnSecondary} onClick={downloadAllJpg}>
                ↓ Todos JPG
              </button>
              <button className={styles.btnPrimary} onClick={downloadAllPdf}>
                ↓ PDF completo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
