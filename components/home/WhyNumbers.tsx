"use client";
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import s from "./home.module.css";

const REASONS = [
  {
    title: "Velocidad sin atajos",
    desc: "Entregamos rápido porque tenemos el proceso claro, no porque cortemos esquinas. Tus plazos los cumplimos o los renegociamos antes, no después.",
  },
  {
    title: "Transparencia total",
    desc: "Sabes el precio y los tiempos antes de firmar. Si algo cambia en el camino, te lo decimos de frente, nunca en la factura final.",
  },
  {
    title: "Stack que escala",
    desc: "Usamos las mismas tecnologías que usan las empresas que quieres parecer. Lo que construimos hoy no te frena mañana cuando crezcas.",
  },
];

const METRICS = [
  { value: 100, suffix: "%", label: "Transparencia desde la primera llamada" },
  { value: 24, suffix: "h", label: "Tiempo máximo de respuesta" },
  { value: 32, suffix: " estados", label: "Cobertura nacional, base en Durango" },
];

function Rolling({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <>
      <span ref={ref}>{value}</span>
      {suffix}
    </>
  );
}

export function WhyNumbers() {
  return (
    <section id="por-que" className={s.why} data-st>
      <div className={s.whyHead}>
        <h2 className={s.h2} data-reveal>
          Por qué Nexium
        </h2>
        <p className={s.lead} data-reveal>
          Hay cientos de agencias. Estas son las razones concretas por las que algunos nos eligen.
        </p>
      </div>
      <div className={s.whyGrid}>
        {REASONS.map((r, i) => (
          <div key={r.title} className={s.whyItem} data-reveal style={{ ["--i" as string]: i }}>
            <h3 className={s.whyTitle}>{r.title}</h3>
            <p className={s.whyDesc}>{r.desc}</p>
          </div>
        ))}
      </div>
      <dl className={s.nums}>
        {METRICS.map((m, i) => (
          <div key={m.label} className={s.num} data-reveal style={{ ["--i" as string]: i }}>
            <dt className={s.numLabel}>{m.label}</dt>
            <dd className={s.numValue}>
              <Rolling value={m.value} suffix={m.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
