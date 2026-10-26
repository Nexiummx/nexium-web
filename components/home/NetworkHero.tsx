"use client";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { WaIcon } from "@/components/icons/WaIcon";
import s from "./home.module.css";

// Coordenadas en unidades de un cuadrado de 1000 × 1000: los destinos son los
// nodos del ícono oficial de Nexium (public/brand/nexium-icon-dark.svg).
type Point = [number, number];
type Node = { label: string; to: Point; wide: Point; narrow: Point; lit?: boolean };

const NODES: Node[] = [
  { label: "Clientes", to: [214.75, 700.85], wide: [-470, 1060], narrow: [190, 1590] },
  { label: "Inventario", to: [418.03, 491.42], wide: [-520, 170], narrow: [770, -330] },
  { label: "Cobros", to: [571.31, 540.11], wide: [1520, 900], narrow: [800, 1520] },
  { label: "Reportes", to: [779.51, 309.46], wide: [1480, 80], narrow: [560, 1760] },
  { label: "Pedidos por WhatsApp", to: [343.44, 665.2], wide: [-330, -40], narrow: [300, -430], lit: true },
  { label: "Facturas", to: [636.89, 357.33], wide: [1080, 1230], narrow: [250, -250], lit: true },
];

const EDGES = [
  "M571.31 540.11 L418.03 271.34 L214.75 700.85",
  "M777.05 309.46 L568.85 745.85 L415.57 491.42",
  "M343.44 665.2 L418.03 491.42",
  "M571.31 540.11 L636.89 357.33",
];
const HEX = "M500 112 L836 300 L836 700 L500 888 L164 700 L164 300 Z";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const span = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Chip({
  node,
  index,
  p,
  side,
  narrow,
}: {
  node: Node;
  index: number;
  p: MotionValue<number>;
  side: number;
  narrow: boolean;
}) {
  const from = narrow ? node.narrow : node.wide;
  // Cada etiqueta sale con un pequeño desfase para que el grupo no se mueva en bloque.
  const a = 0.08 + index * 0.025;
  const b = 0.5 + index * 0.02;
  const k = side / 1000;
  const x = useTransform(p, (v) => {
    const t = inOut(span(v, a, b));
    return (from[0] + (node.to[0] - from[0]) * t) * k;
  });
  const y = useTransform(p, (v) => {
    const t = inOut(span(v, a, b));
    return (from[1] + (node.to[1] - from[1]) * t) * k;
  });
  const opacity = useTransform(p, [b - 0.06, b + 0.04], [1, 0]);
  const scale = useTransform(p, [a, b], [1, 0.82]);

  return (
    <motion.span className={s.chip} style={{ x, y, opacity, scale }} aria-hidden="true">
      <span className={s.chipFloat} style={{ animationDelay: `${index * -0.9}s` }}>
        <i className={node.lit ? s.dotLit : s.dot} />
        {node.label}
      </span>
    </motion.span>
  );
}

function Network({ p, finished }: { p: MotionValue<number>; finished: boolean }) {
  const edge = useTransform(p, [0.52, 0.78], [0, 1]);
  const hex = useTransform(p, [0.7, 0.94], [0, 1]);
  const nodes = useTransform(p, [0.46, 0.58], [0, 1]);
  return (
    <svg className={s.netSvg} viewBox="0 0 1000 1000" aria-hidden="true">
      <motion.path
        d={HEX}
        className={s.netHex}
        style={finished ? undefined : { pathLength: hex, opacity: hex }}
      />
      {EDGES.map((d) => (
        <motion.path
          key={d}
          d={d}
          className={s.netEdge}
          style={finished ? undefined : { pathLength: edge, opacity: edge }}
        />
      ))}
      <motion.g style={finished ? undefined : { opacity: nodes }}>
        {NODES.map((n) => (
          <circle key={n.label} cx={n.to[0]} cy={n.to[1]} r={34} className={n.lit ? s.netLit : s.netNode} />
        ))}
      </motion.g>
    </svg>
  );
}

export function NetworkHero() {
  const { waLinks } = useSiteWa();
  const reduced = useReducedMotion();
  const track = useRef<HTMLElement>(null);
  const square = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);
  const [narrow, setNarrow] = useState(false);

  const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
  const textOpacity = useTransform(p, [0.04, 0.3], [1, 0]);
  const textY = useTransform(p, [0, 0.3], [0, -60]);
  const textEvents = useTransform(p, (v) => (v > 0.24 ? "none" : "auto"));
  const captionOpacity = useTransform(p, [0.74, 0.86], [0, 1]);
  const captionY = useTransform(p, [0.74, 0.86], [24, 0]);

  useEffect(() => {
    const el = square.current;
    if (!el) return;
    const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
    const measure = () => {
      setSide(el.offsetWidth);
      setNarrow(mq.matches);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mq.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", measure);
    };
  }, []);

  const copy = (
    <>
      <p className={s.heroEye}>Agencia tech en Durango</p>
      <h1 className={s.heroTitle}>
        Tu negocio, <span className={s.heroAcc}>digital</span> y escalando.
      </h1>
      <p className={s.heroSub}>
        Construimos el software que tu negocio necesita para dejar de hacer las cosas a mano y crecer sin límites
        técnicos.
      </p>
      <div className={s.heroCtas}>
        {waLinks && (
          <a href={waLinks.hero} className="btn-p" target="_blank" rel="noopener noreferrer">
            <WaIcon /> Hablemos de tu negocio
          </a>
        )}
        <a href="#servicios" className="btn-s">
          Ver servicios
        </a>
      </div>
    </>
  );

  if (reduced) {
    return (
      <section id="hero" className={s.heroStatic} data-st>
        <div className={s.heroCopy}>{copy}</div>
        <div className={s.heroStaticNet}>
          <Network p={p} finished />
        </div>
      </section>
    );
  }

  return (
    <section id="hero" ref={track} className={s.heroTrack} data-st>
      <div className={s.heroStage}>
        <div className={s.heroSquare} ref={square}>
          <Network p={p} finished={false} />
          {side > 0 &&
            NODES.map((n, i) => <Chip key={n.label} node={n} index={i} p={p} side={side} narrow={narrow} />)}
        </div>

        <motion.div className={s.heroCopy} style={{ opacity: textOpacity, y: textY, pointerEvents: textEvents }}>
          {copy}
        </motion.div>

        <motion.div className={s.heroCaption} style={{ opacity: captionOpacity, y: captionY }} aria-hidden="true">
          <p className={s.heroCaptionBig}>Todo conectado.</p>
          <p className={s.heroCaptionSmall}>Ventas, inventario y clientes en un solo sistema.</p>
        </motion.div>
      </div>
    </section>
  );
}
