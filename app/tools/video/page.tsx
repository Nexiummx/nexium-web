"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import styles from "./video.module.css";
import { extractRawMetadata } from "@/lib/video/extractMetadata";
import { setNexiumMetaContent } from "@/lib/video/patchNexiumMeta";
import { VIDEO_LIMITS } from "@/lib/video/config";
import { buildVideoIframeDocument } from "@/lib/video/iframeBridge";
import {
  emptyMotionOverrides,
  type MotionCatalogPayload,
  type MotionCatalogGsapRow,
  type MotionOverridesV0,
  type GsapTweenPatchV0,
  type CssAnimPatchV0,
} from "@/lib/motion-overrides/types";
import { fingerprintHtml } from "@/lib/motion-overrides/fingerprint";
import {
  loadMotionOverridesFromStorage,
  saveMotionOverridesToStorage,
} from "@/lib/motion-overrides/storage";

/* ── Constantes ─────────────────────────────────────────────────────────── */
const ACCESS_TOKEN = "nexium-slides-2026";

/** Fases de exportación: [mensaje, % al llegar a esta fase] */
const EXPORT_PHASES: [string, number][] = [
  ["Iniciando Chromium…",      8],
  ["Cargando fuentes y CSS…", 18],
  ["Capturando frames…",      30],
  ["Capturando frames…",      62],
  ["Codificando con ffmpeg…", 88],
  ["Finalizando…",            96],
];

/** En Vercel el hostname termina en vercel.app o es el dominio de producción */
const isVercelEnv = () =>
  typeof window !== "undefined" &&
  (window.location.hostname.endsWith(".vercel.app") ||
    window.location.hostname === "nexiummx.com" ||
    window.location.hostname === "www.nexiummx.com");

/* ── Utilidades ─────────────────────────────────────────────────────────── */
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatSec(s: number): string {
  if (!Number.isFinite(s)) return "0.00";
  return s.toFixed(2);
}

/** Subtítulo legible para cabeceras de escena (#scene-cta → cta). */
function sceneHeadingSuffix(sceneId: string): string {
  if (sceneId === "sin-escena") return "";
  if (sceneId.startsWith("scene-")) {
    const slug = sceneId.slice(6);
    return slug ? slug.replace(/-/g, " ") : "";
  }
  return "";
}

function getFullscreenElement(): Element | null {
  const d = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  const wk = (el as HTMLElement & { webkitRequestFullscreen?: () => void })
    .webkitRequestFullscreen;
  if (el.requestFullscreen) await el.requestFullscreen();
  else if (wk) wk.call(el);
  else throw new Error("fullscreen");
}

async function exitElementFullscreen(): Promise<void> {
  const d = document as Document & { webkitExitFullscreen?: () => void };
  if (document.exitFullscreen) await document.exitFullscreen();
  else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
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

function pruneGsapPatches(patches: GsapTweenPatchV0[]): GsapTweenPatchV0[] {
  return patches.filter(
    (p) =>
      p.duration !== undefined ||
      p.delay !== undefined ||
      (p.ease !== undefined && String(p.ease).trim() !== "")
  );
}

/** Combina parches por tween con factores por escena para lo que recibe el iframe / export. */
function buildEffectiveGsapPatchesForApply(
  catalog: MotionCatalogGsapRow[] | null | undefined,
  patches: GsapTweenPatchV0[],
  sceneScales: Record<string, number> | undefined
): GsapTweenPatchV0[] {
  if (!catalog?.length) return pruneGsapPatches(patches);
  const scales = sceneScales ?? {};
  const byId = new Map(patches.map((p) => [p.id, p]));
  const merged: GsapTweenPatchV0[] = [];
  for (const row of catalog) {
    const p = byId.get(row.id);
    const scale = scales[row.sceneId ?? "sin-escena"] ?? 1;
    const intrinsic = p?.duration !== undefined ? p.duration : row.duration;
    const effectiveDur = intrinsic * scale;
    const next: GsapTweenPatchV0 = { id: row.id };
    if (p?.delay !== undefined) next.delay = p.delay;
    if (p?.ease !== undefined && String(p.ease).trim() !== "") next.ease = p.ease;
    const needDur =
      scale !== 1 ||
      p?.duration !== undefined ||
      Math.abs(effectiveDur - row.duration) > 1e-6;
    if (needDur) next.duration = effectiveDur;
    merged.push(next);
  }
  return pruneGsapPatches(merged);
}

function pruneCssPatches(patches: CssAnimPatchV0[]): CssAnimPatchV0[] {
  return patches.filter(
    (p) =>
      (p.animationDuration !== undefined &&
        String(p.animationDuration).trim() !== "") ||
      (p.animationDelay !== undefined && String(p.animationDelay).trim() !== "")
  );
}

/* ── Componente principal ────────────────────────────────────────────────── */
export default function VideoToolPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [html, setHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState(""); // lo que está en el iframe
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ cur: 0, dur: 0 });
  const progressRef = useRef(progress);
  const previewHtmlRef = useRef(previewHtml);
  const scrubbingRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPhase, setExportPhase] = useState(0);   // índice en EXPORT_PHASES
  const [exportPct, setExportPct] = useState(0);        // 0-100
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [metaDurDraft, setMetaDurDraft] = useState("");
  const [metaFpsDraft, setMetaFpsDraft] = useState("");
  const [motionOverrides, setMotionOverrides] = useState<MotionOverridesV0>(() =>
    emptyMotionOverrides("")
  );
  const [motionCatalog, setMotionCatalog] = useState<MotionCatalogPayload | null>(null);
  const [motionCatalogTick, setMotionCatalogTick] = useState(0);
  const [activeGsapIds, setActiveGsapIds] = useState<string[]>([]);
  const [activeCssIds, setActiveCssIds] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewFullscreenRef = useRef<HTMLDivElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("nxt_tool_unlocked") === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    const saved = loadMotionOverridesFromStorage();
    if (saved) setMotionOverrides(saved);
  }, []);

  // Escuchar progreso del iframe
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    previewHtmlRef.current = previewHtml;
  }, [previewHtml]);

  useEffect(() => {
    const m = extractRawMetadata(html);
    setMetaDurDraft(m.duration ?? "");
    setMetaFpsDraft(m.fps ?? "");
  }, [html]);

  useEffect(() => {
    const sync = () => {
      const shell = previewFullscreenRef.current;
      setIsPreviewFullscreen(Boolean(shell && getFullscreenElement() === shell));
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.nexiumProgress) {
        const p = e.data.nexiumProgress as {
          cur: number;
          dur: number;
          activeGsapIds?: string[];
          activeCssIds?: string[];
        };
        setProgress({ cur: p.cur, dur: p.dur });
        setActiveGsapIds(Array.isArray(p.activeGsapIds) ? p.activeGsapIds : []);
        setActiveCssIds(Array.isArray(p.activeCssIds) ? p.activeCssIds : []);
      }
      if (e.data?.nexiumMotionCatalog) {
        setMotionCatalog(e.data.nexiumMotionCatalog);
        setMotionCatalogTick((t) => t + 1);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const updateSeekFromClientX = useCallback((clientX: number) => {
    const el = progressBarRef.current;
    const dur = progressRef.current.dur;
    if (!el || dur <= 0) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetMs = ratio * dur;
    iframeRef.current?.contentWindow?.postMessage(
      { nexiumCmd: "seek", sec: targetMs / 1000, ms: targetMs },
      "*"
    );
  }, []);

  const endProgressScrub = (el: HTMLDivElement, pointerId: number) => {
    scrubbingRef.current = false;
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* no captura activa */
    }
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const effectiveGsapForApply = useMemo(
    () =>
      buildEffectiveGsapPatchesForApply(
        motionCatalog?.gsap,
        motionOverrides.gsap,
        motionOverrides.gsapSceneDurationScale
      ),
    [
      motionCatalog?.gsap,
      motionOverrides.gsap,
      motionOverrides.gsapSceneDurationScale,
    ]
  );

  const motionApplySerialized = useMemo(
    () =>
      JSON.stringify({
        gsap: effectiveGsapForApply,
        css: motionOverrides.css,
      }),
    [effectiveGsapForApply, motionOverrides.css]
  );

  const augmentedHtml = useMemo(
    () =>
      previewHtml
        ? buildVideoIframeDocument(previewHtml, {
            gsap: effectiveGsapForApply,
            css: motionOverrides.css,
          })
        : "",
    [previewHtml, motionApplySerialized]
  );

  const htmlFingerprint = useMemo(() => fingerprintHtml(html), [html]);
  const hasSceneScales =
    motionOverrides.gsapSceneDurationScale &&
    Object.keys(motionOverrides.gsapSceneDurationScale).length > 0;
  const motionFingerprintMismatch =
    Boolean(motionOverrides.htmlFingerprint) &&
    motionOverrides.htmlFingerprint !== htmlFingerprint &&
    (motionOverrides.gsap.length > 0 ||
      motionOverrides.css.length > 0 ||
      Boolean(hasSceneScales));

  const gsapSceneGroups = useMemo(() => {
    if (!motionCatalog?.gsap?.length) return [];
    const order: string[] = [];
    const map = new Map<string, MotionCatalogGsapRow[]>();
    for (const row of motionCatalog.gsap) {
      const sid = row.sceneId ?? "sin-escena";
      if (!map.has(sid)) {
        map.set(sid, []);
        order.push(sid);
      }
      map.get(sid)!.push(row);
    }
    for (const sid of order) {
      map.get(sid)!.sort((a, b) => (a.startSec ?? 0) - (b.startSec ?? 0));
    }
    return order.map((sceneId) => ({
      sceneId,
      suffix: sceneHeadingSuffix(sceneId),
      rows: map.get(sceneId)!,
    }));
  }, [motionCatalog]);

  const sendCmd = (cmd: string, extra?: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage({ nexiumCmd: cmd, ...extra }, "*");
  };

  const handlePreview = useCallback(() => {
    if (!html.trim()) return;
    setPreviewHtml(html);
    setIsPaused(false);
    setProgress({ cur: 0, dur: 0 });
    setActiveGsapIds([]);
    setActiveCssIds([]);
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
    setActiveGsapIds([]);
    setActiveCssIds([]);
  };

  const handleClear = () => {
    setHtml("");
    setPreviewHtml("");
    setProgress({ cur: 0, dur: 0 });
    setActiveGsapIds([]);
    setActiveCssIds([]);
    setMotionCatalog(null);
    setMotionOverrides(emptyMotionOverrides(""));
    setError("");
    textareaRef.current?.focus();
  };

  const commitMetaDuration = useCallback(() => {
    const raw = metaDurDraft.trim().replace(",", ".");
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) {
      const m = extractRawMetadata(html);
      setMetaDurDraft(m.duration ?? "");
      return;
    }
    const c = Math.min(
      VIDEO_LIMITS.MAX_DURATION_SECONDS,
      Math.max(VIDEO_LIMITS.MIN_DURATION_SECONDS, n)
    );
    const next = setNexiumMetaContent(html, "duration", String(c));
    setMetaDurDraft(String(c));
    setHtml(next);
    if (previewHtml) setPreviewHtml(next);
  }, [metaDurDraft, html, previewHtml]);

  const commitMetaFps = useCallback(() => {
    const raw = metaFpsDraft.trim();
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) {
      const m = extractRawMetadata(html);
      setMetaFpsDraft(m.fps ?? "");
      return;
    }
    const c = Math.min(
      VIDEO_LIMITS.MAX_FPS,
      Math.max(VIDEO_LIMITS.MIN_FPS, n)
    );
    const next = setNexiumMetaContent(html, "fps", String(c));
    setMetaFpsDraft(String(c));
    setHtml(next);
    if (previewHtml) setPreviewHtml(next);
  }, [metaFpsDraft, html, previewHtml]);

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

  const saveMotionToBrowser = useCallback(() => {
    const payload: MotionOverridesV0 = {
      ...motionOverrides,
      htmlFingerprint: fingerprintHtml(html),
      gsap: motionOverrides.gsap,
      css: motionOverrides.css,
    };
    setMotionOverrides(payload);
    saveMotionOverridesToStorage(payload);
    showSuccess("Overrides guardados en este navegador.");
  }, [motionOverrides, html]);

  const clearMotionOverridesState = useCallback(() => {
    const next = emptyMotionOverrides(fingerprintHtml(html));
    setMotionOverrides(next);
    saveMotionOverridesToStorage(next);
    setMotionCatalog(null);
    showSuccess("Overrides limpiados.");
  }, [html]);

  const downloadMotionOverridesJson = useCallback(() => {
    const payload: MotionOverridesV0 = {
      ...motionOverrides,
      htmlFingerprint: fingerprintHtml(html),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nexium-motion-overrides.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, [motionOverrides, html]);

  const syncMotionFingerprint = useCallback(() => {
    setMotionOverrides((prev) => ({
      ...prev,
      htmlFingerprint: fingerprintHtml(html),
    }));
  }, [html]);

  const commitGsapField = useCallback(
    (id: string, field: "duration" | "delay" | "ease", raw: string) => {
      setMotionOverrides((prev) => {
        const others = prev.gsap.filter((p) => p.id !== id);
        const base: GsapTweenPatchV0 = prev.gsap.find((p) => p.id === id) ?? { id };
        const next: GsapTweenPatchV0 = { ...base, id };
        if (field === "ease") {
          const t = raw.trim();
          if (t) next.ease = t;
          else delete next.ease;
        }
        if (field === "duration") {
          const n = parseFloat(raw.replace(",", "."));
          if (Number.isFinite(n)) next.duration = n;
          else delete next.duration;
        }
        if (field === "delay") {
          const n = parseFloat(raw.replace(",", "."));
          if (Number.isFinite(n)) next.delay = n;
          else delete next.delay;
        }
        return { ...prev, gsap: pruneGsapPatches([...others, next]) };
      });
    },
    []
  );

  const commitGsapSceneScale = useCallback((sceneId: string, raw: string) => {
    const n = parseFloat(raw.replace(",", "."));
    setMotionOverrides((prev) => {
      const scales = { ...(prev.gsapSceneDurationScale ?? {}) };
      if (!Number.isFinite(n) || n <= 0) return prev;
      if (Math.abs(n - 1) < 1e-4) delete scales[sceneId];
      else scales[sceneId] = n;
      const keys = Object.keys(scales);
      return {
        ...prev,
        gsapSceneDurationScale: keys.length > 0 ? scales : undefined,
      };
    });
  }, []);

  const commitCssField = useCallback(
    (id: string, field: "animationDuration" | "animationDelay", raw: string) => {
      setMotionOverrides((prev) => {
        const others = prev.css.filter((p) => p.id !== id);
        const base: CssAnimPatchV0 = prev.css.find((p) => p.id === id) ?? { id };
        const next: CssAnimPatchV0 = { ...base, id };
        const t = raw.trim();
        if (field === "animationDuration") {
          if (t) next.animationDuration = t;
          else delete next.animationDuration;
        } else {
          if (t) next.animationDelay = t;
          else delete next.animationDelay;
        }
        return { ...prev, css: pruneCssPatches([...others, next]) };
      });
    },
    []
  );

  /**
   * En local: llama a /api/export/video y descarga el MP4 directamente.
   * En Vercel: abre el modal con las instrucciones del script local.
   */
  const handleExport = useCallback(async () => {
    if (!html.trim() || exporting) return;

    // En Vercel: mostrar modal con instrucciones
    if (isVercelEnv()) {
      setShowExportModal(true);
      return;
    }

    // En local: exportar directo via API
    setExporting(true);
    setExportPhase(0);
    setExportPct(EXPORT_PHASES[0][1]);
    setError("");
    setSuccessMsg("");

    // Avanza automáticamente fase a fase cada ~8s mientras el fetch corre
    let phaseIdx = 0;
    const phaseTimer = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, EXPORT_PHASES.length - 1);
      setExportPhase(phaseIdx);
      setExportPct(EXPORT_PHASES[phaseIdx][1]);
    }, 8000);

    try {
      const res = await fetch("/api/export/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          motionApply: {
            gsap: effectiveGsapForApply,
            css: motionOverrides.css,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Error ${res.status}`);
      }

      const contentType = res.headers.get("Content-Type") ?? "";

      // Llegar a 100% justo antes de la descarga
      setExportPct(100);

      if (contentType.includes("video/mp4")) {
        const filename = res.headers.get("X-Nexium-Filename") ?? "video.mp4";
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
        showSuccess(`✓ Descargado: ${filename}`);
      } else {
        const data = await res.json() as { success: boolean; videoUrl?: string; filename?: string; error?: string };
        if (!data.success) throw new Error(data.error ?? "Error desconocido");
        const a = document.createElement("a");
        a.href = data.videoUrl!;
        a.download = data.filename ?? "video.mp4";
        a.target = "_blank";
        a.click();
        showSuccess(`✓ Video listo: ${data.filename}`);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Error al exportar el video.");
    } finally {
      clearInterval(phaseTimer);
      setExporting(false);
      setExportPhase(0);
      setExportPct(0);
    }
  }, [
    html,
    exporting,
    effectiveGsapForApply,
    motionOverrides.css,
  ]);

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

  useEffect(() => {
    if (!isPreviewFullscreen || !previewStageRef.current || !previewHtml) return;
    const stage = previewStageRef.current;
    const update = () => {
      const rect = stage.getBoundingClientRect();
      const pad = 32;
      const aw = Math.max(0, rect.width - pad);
      const ah = Math.max(0, rect.height - pad);
      if (iframeW <= 0 || iframeH <= 0) return;
      const s = Math.min(aw / iframeW, ah / iframeH, 1);
      setFullscreenScale(Number.isFinite(s) && s > 0 ? s : 1);
    };
    update();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(stage);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isPreviewFullscreen, iframeW, iframeH, previewHtml]);

  const previewScale = isPreviewFullscreen ? fullscreenScale : scale;
  const previewDisplayW = Math.round(iframeW * previewScale);
  const previewDisplayH = Math.round(iframeH * previewScale);

  const togglePreviewFullscreen = useCallback(async () => {
    const shell = previewFullscreenRef.current;
    if (!shell || !previewHtml) return;
    try {
      if (getFullscreenElement() === shell) {
        await exitElementFullscreen();
      } else {
        await requestElementFullscreen(shell);
      }
    } catch {
      /* sin API o bloqueado */
    }
  }, [previewHtml]);

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
              <><span className={styles.spinner} />{EXPORT_PHASES[exportPhase][0]}</>
            ) : "↓ Exportar MP4"}
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
            placeholder={`Pega aquí tu HTML animado.\n\nEl video se auto-configura con meta tags:\n\n<meta name="nexium:type" content="story">\n<meta name="nexium:duration" content="12">\n<meta name="nexium:fps" content="60">\n\nPresets: story · reel · square · landscape · tiktok`}
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

        {/* Columna central — preview + export */}
        <div className={styles.previewColumn}>
          <div
            ref={previewFullscreenRef}
            className={styles.previewFsShell}
          >
            <div className={styles.previewHeader}>
              <span>Vista previa</span>
              <div className={styles.previewHeaderRight}>
                {previewHtml && (
                  <span className={styles.previewMeta}>
                    {iframeW}×{iframeH} · {previewDisplayW}×{previewDisplayH}px (escala{" "}
                    {(previewScale * 100).toFixed(0)}%)
                  </span>
                )}
                <button
                  type="button"
                  className={styles.btnFullscreen}
                  onClick={() => void togglePreviewFullscreen()}
                  disabled={!previewHtml}
                  title={
                    isPreviewFullscreen
                      ? "Salir de pantalla completa (Esc)"
                      : "Ver vista previa en pantalla completa"
                  }
                >
                  {isPreviewFullscreen ? "Salir" : "Pantalla completa"}
                </button>
              </div>
            </div>

            <div className={styles.metaQuickPanel}>
              <p className={styles.metaQuickHint}>
                Ajusta los meta de exportación. Con{" "}
                <code className={styles.inlineCode}>GSAP</code>, la vista previa acelera o
                ralentiza la timeline para encajar en la duración indicada (animaciones CSS no se
                retiman aquí).
              </p>
              <label className={styles.metaQuickField}>
                <span>Duración (s)</span>
                <input
                  type="number"
                  min={VIDEO_LIMITS.MIN_DURATION_SECONDS}
                  max={VIDEO_LIMITS.MAX_DURATION_SECONDS}
                  step={0.1}
                  value={metaDurDraft}
                  disabled={!html.trim()}
                  onChange={(e) => setMetaDurDraft(e.target.value)}
                  onBlur={commitMetaDuration}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  title={`Export ${VIDEO_LIMITS.MIN_DURATION_SECONDS}–${VIDEO_LIMITS.MAX_DURATION_SECONDS} s`}
                />
              </label>
              <label className={styles.metaQuickField}>
                <span>FPS</span>
                <input
                  type="number"
                  min={VIDEO_LIMITS.MIN_FPS}
                  max={VIDEO_LIMITS.MAX_FPS}
                  step={1}
                  value={metaFpsDraft}
                  disabled={!html.trim()}
                  onChange={(e) => setMetaFpsDraft(e.target.value)}
                  onBlur={commitMetaFps}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  title={`${VIDEO_LIMITS.MIN_FPS}–${VIDEO_LIMITS.MAX_FPS} FPS`}
                />
              </label>
            </div>

            {/* Escenario del iframe */}
            <div ref={previewStageRef} className={styles.previewStage}>
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
                  style={{ width: previewDisplayW, height: previewDisplayH }}
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
                      transform: `scale(${previewScale})`,
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

              {/* Barra de progreso (clic / arrastrar para ir a un instante) */}
              <div
                ref={progressBarRef}
                className={`${styles.progressBar} ${
                  !previewHtml || progress.dur <= 0 ? styles.progressBarInactive : ""
                }`}
                title={
                  previewHtml && progress.dur > 0
                    ? "Clic o arrastra para ir a esa posición"
                    : undefined
                }
                onPointerDown={(e) => {
                  if (!previewHtmlRef.current || progressRef.current.dur <= 0) return;
                  if (e.pointerType === "mouse" && e.button !== 0) return;
                  e.preventDefault();
                  scrubbingRef.current = true;
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    scrubbingRef.current = false;
                    return;
                  }
                  updateSeekFromClientX(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (!scrubbingRef.current) return;
                  updateSeekFromClientX(e.clientX);
                }}
                onPointerUp={(e) => {
                  if (!scrubbingRef.current) return;
                  endProgressScrub(e.currentTarget, e.pointerId);
                }}
                onPointerCancel={(e) => {
                  if (!scrubbingRef.current) return;
                  endProgressScrub(e.currentTarget, e.pointerId);
                }}
                onLostPointerCapture={() => {
                  scrubbingRef.current = false;
                }}
              >
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
          </div>

          {/* Barra de exportación */}
          <div className={styles.exportBar}>
            {exporting ? (
              <div className={styles.exportProgressWrap}>
                <div className={styles.exportProgressRow}>
                  <span className={styles.exportProgressLabel}>
                    {EXPORT_PHASES[exportPhase][0]}
                  </span>
                  <span className={styles.exportProgressPct}>{exportPct}%</span>
                </div>
                <div className={styles.exportProgressTrack}>
                  <div
                    className={styles.exportProgressFill}
                    style={{ width: `${exportPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className={styles.exportInfo}>
                <span className={styles.exportInfoStrong}>Exportar MP4 </span>
                — Chromium headless + ffmpeg H.264 · CRF 18 · resolución completa
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

        <aside className={styles.motionSidebar} aria-label="Motion overrides">
          <div className={styles.motionSidebarPlayhead}>
            <span className={styles.motionSidebarPlayheadLabel}>Cabezal</span>
            <span className={styles.motionSidebarPlayheadValue}>
              {previewHtml && progress.dur > 0
                ? `${formatSec(currentS)} s`
                : "—"}
            </span>
            <span className={styles.motionSidebarPlayheadHint}>
              Las filas resaltadas coinciden con el tiempo actual de la reproducción.
            </span>
          </div>
          <div className={styles.motionSidebarInner}>
            <div className={styles.motionPhase1Header}>
              <span className={styles.motionPhase1Title}>Motion · fase 1</span>
              <div className={styles.motionPhase1Actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={saveMotionToBrowser}
                  disabled={!html.trim()}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={downloadMotionOverridesJson}
                  disabled={!html.trim()}
                >
                  JSON
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={clearMotionOverridesState}
                  disabled={!html.trim()}
                >
                  Limpiar
                </button>
              </div>
            </div>
            <p className={styles.motionPhase1Hint}>
              Overrides en JSON. IDs <code className={styles.inlineCode}>g_*</code> = orden{" "}
              <code className={styles.inlineCode}>getChildren()</code> en la timeline raíz. Por
              bloque,{" "}
              <span className={styles.motionHintStrong}>× duración</span> multiplica
              la duración intrínseca de cada fila de esa escena (la columna Dur sigue siendo el
              valor base; Fin refleja el resultado con el factor).
            </p>
            {motionFingerprintMismatch && (
              <p className={styles.motionMismatch}>
                Huella distinta al HTML.{" "}
                <button
                  type="button"
                  className={styles.motionLinkBtn}
                  onClick={syncMotionFingerprint}
                >
                  Marcar este HTML como base
                </button>
              </p>
            )}
            {!previewHtml && (
              <p className={styles.motionEmpty}>
                Previsualizá para listar tweens y CSS.
              </p>
            )}
            {previewHtml && !motionCatalog && (
              <p className={styles.motionEmpty}>Analizando…</p>
            )}
            {motionCatalog && gsapSceneGroups.length > 0 && (
              <>
                <h4 className={styles.motionSubTitle}>GSAP</h4>
                {gsapSceneGroups.map((group) => (
                  <div key={group.sceneId} className={styles.motionSceneBlock}>
                    <div className={styles.motionSceneHeadingRow}>
                      <h5 className={styles.motionSceneHeading}>
                        <span className={styles.motionMono}>{group.sceneId}</span>
                        {group.suffix ? (
                          <span className={styles.motionSceneHeadingSuffix}>
                            {" — "}
                            {group.suffix}
                          </span>
                        ) : null}
                      </h5>
                      <div className={styles.motionSceneScale}>
                        <label
                          className={styles.motionSceneScaleLabel}
                          htmlFor={`nx-sc-${group.sceneId}`}
                        >
                          × dur.
                        </label>
                        <input
                          id={`nx-sc-${group.sceneId}`}
                          type="number"
                          className={styles.motionSceneScaleInput}
                          step="0.05"
                          min="0.25"
                          max="8"
                          title="Multiplicador de duración para todos los tweens de este bloque"
                          key={`sc-${group.sceneId}-${motionCatalogTick}-${motionOverrides.gsapSceneDurationScale?.[group.sceneId] ?? 1}`}
                          defaultValue={
                            motionOverrides.gsapSceneDurationScale?.[group.sceneId] ?? 1
                          }
                          onBlur={(e) =>
                            commitGsapSceneScale(group.sceneId, e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className={styles.motionTableWrap}>
                      <table className={styles.motionTable}>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Dur</th>
                            <th>delay</th>
                            <th>Target</th>
                            <th>ease</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => {
                            const p = motionOverrides.gsap.find((x) => x.id === row.id);
                            const durDisp =
                              p?.duration !== undefined
                                ? String(p.duration)
                                : String(row.duration);
                            const delDisp =
                              p?.delay !== undefined ? String(p.delay) : String(row.delay);
                            const easeDisp =
                              p?.ease !== undefined && p.ease !== ""
                                ? String(p.ease)
                                : String(row.ease);
                            const startSec = row.startSec ?? 0;
                            const sceneKey = row.sceneId ?? "sin-escena";
                            const blockScale =
                              motionOverrides.gsapSceneDurationScale?.[sceneKey] ?? 1;
                            const intrinsicDur =
                              p?.duration !== undefined ? p.duration : (row.duration ?? 0);
                            const endSec = startSec + intrinsicDur * blockScale;
                            const rowActive = activeGsapIds.includes(row.id);
                            return (
                              <tr
                                key={row.id}
                                className={rowActive ? styles.motionRowActive : undefined}
                              >
                                <td className={styles.motionMono}>{row.id}</td>
                                <td className={styles.motionMono}>{formatSec(startSec)}</td>
                                <td className={styles.motionMono}>{formatSec(endSec)}</td>
                                <td>
                                  <input
                                    key={`${row.id}-d-${motionCatalogTick}`}
                                    className={styles.motionCellInput}
                                    defaultValue={durDisp}
                                    onBlur={(e) =>
                                      commitGsapField(row.id, "duration", e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    key={`${row.id}-l-${motionCatalogTick}`}
                                    className={styles.motionCellInput}
                                    defaultValue={delDisp}
                                    onBlur={(e) =>
                                      commitGsapField(row.id, "delay", e.target.value)
                                    }
                                  />
                                </td>
                                <td className={styles.motionLabelCell}>{row.label}</td>
                                <td>
                                  <input
                                    key={`${row.id}-e-${motionCatalogTick}`}
                                    className={styles.motionCellInput}
                                    defaultValue={easeDisp}
                                    onBlur={(e) =>
                                      commitGsapField(row.id, "ease", e.target.value)
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}
            {motionCatalog && motionCatalog.css.length > 0 && (
              <>
                <h4 className={styles.motionSubTitle}>CSS</h4>
                <div className={styles.motionTableWrap}>
                  <table className={styles.motionTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Elem</th>
                        <th>@keyframes</th>
                        <th>dur</th>
                        <th>delay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {motionCatalog.css.map((row) => {
                        const p = motionOverrides.css.find((x) => x.id === row.id);
                        const durDisp =
                          p?.animationDuration !== undefined
                            ? p.animationDuration
                            : row.duration;
                        const delDisp =
                          p?.animationDelay !== undefined ? p.animationDelay : row.delay;
                        const startSec = row.startSec ?? 0;
                        const endSec = row.endSec ?? startSec;
                        const rowActive = activeCssIds.includes(row.id);
                        return (
                          <tr
                            key={row.id}
                            className={rowActive ? styles.motionRowActive : undefined}
                          >
                            <td className={styles.motionMono}>{row.id}</td>
                            <td className={styles.motionMono}>{formatSec(startSec)}</td>
                            <td className={styles.motionMono}>{formatSec(endSec)}</td>
                            <td className={styles.motionLabelCell}>{row.label}</td>
                            <td className={styles.motionMono}>{row.animationName}</td>
                            <td>
                              <input
                                key={`${row.id}-cd-${motionCatalogTick}`}
                                className={styles.motionCellInput}
                                defaultValue={durDisp}
                                onBlur={(e) =>
                                  commitCssField(row.id, "animationDuration", e.target.value)
                                }
                                placeholder="2s"
                              />
                            </td>
                            <td>
                              <input
                                key={`${row.id}-cl-${motionCatalogTick}`}
                                className={styles.motionCellInput}
                                defaultValue={delDisp}
                                onBlur={(e) =>
                                  commitCssField(row.id, "animationDelay", e.target.value)
                                }
                                placeholder="0s"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {motionCatalog &&
              motionCatalog.gsap.length === 0 &&
              motionCatalog.css.length === 0 && (
                <p className={styles.motionEmpty}>
                  Sin tweens GSAP ni animaciones CSS detectadas.
                </p>
              )}
          </div>
        </aside>
      </div>

      {/* ── Toasts ── */}
      {error && (
        <div className={styles.errorToast}>⚠ {error}</div>
      )}
      {successMsg && (
        <div className={styles.successToast}>{successMsg}</div>
      )}

      {/* ── Modal: instrucciones de exportación local ── */}
      {showExportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Exportar MP4 · Calidad máxima</span>
              <button className={styles.modalClose} onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                La exportación corre <strong>en tu máquina</strong> para garantizar calidad completa:{" "}
                <strong>60fps · 1080×1920 · CRF 18</strong> sin límites de tiempo.
              </p>
              <ol className={styles.modalSteps}>
                <li>
                  Guarda tu HTML en un archivo, por ejemplo:{" "}
                  <code className={styles.inlineCode}>flyer.html</code>
                </li>
                <li>
                  Abre una terminal en la raíz del proyecto{" "}
                  <code className={styles.inlineCode}>nexium-web/</code>
                </li>
                <li>Ejecuta el script:</li>
              </ol>
              <pre className={styles.codeBlock}>{`node scripts/render-gsap-video.mjs flyer.html \\
  --fps 60 \\
  --duration 12 \\
  --width 1080 --height 1920 \\
  --output mi-video`}</pre>
              <p className={styles.modalNote}>
                El script detecta automáticamente GSAP (<code className={styles.inlineCode}>window.tl</code>,{" "}
                <code className={styles.inlineCode}>window.videoTimeline</code>, etc.) o CSS animations puras.
                El MP4 se guarda en la carpeta del proyecto.
              </p>
              <details className={styles.modalDetails}>
                <summary>Ver todas las opciones del script</summary>
                <pre className={styles.codeBlock}>{`--fps <n>          FPS del video (default: 30)
--duration <n>     Duración en segundos
--width <n>        Ancho del viewport (default: 1080)
--height <n>       Alto del viewport (default: 1920)
--output <nombre>  Nombre del archivo de salida
--crf <n>          Calidad H.264 (default: 18 — lossless)
--preset <s>       Velocidad ffmpeg: ultrafast..veryslow
--keep-frames      No borrar los PNG temporales`}</pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
