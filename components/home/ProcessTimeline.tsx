"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    n: "01",
    title: "Descubrimiento",
    body: "Entendemos tu negocio, tus clientes y qué debe lograr el producto.",
  },
  {
    n: "02",
    title: "Estrategia",
    body: "Diseñamos la solución: alcance, stack, tiempos y entregables claros.",
  },
  {
    n: "03",
    title: "Construcción",
    body: "Desarrollamos a la medida con revisiones frecuentes y código limpio.",
  },
  {
    n: "04",
    title: "Lanzamiento",
    body: "Optimizamos, desplegamos y te dejamos listo para operar con confianza.",
  },
];

export function ProcessTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 30%"],
  });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      className="border-t border-white/5 bg-nex-surfaceAlt px-5 py-24 md:px-8 md:py-32 lg:px-16 xl:px-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Cómo trabajamos
        </p>
        <h2 className="mt-4 font-display text-5xl font-normal tracking-tight md:text-6xl lg:text-7xl [line-height:0.95]">
          De idea <em className="italic text-nex-warm">a producción.</em>
        </h2>

        <div className="relative mt-20 hidden lg:block">
          <div className="absolute left-0 right-0 top-[2.25rem] h-px overflow-hidden bg-white/10">
            <motion.div
              className="h-full w-full origin-left bg-nex-blue"
              style={{ scaleX: line }}
            />
          </div>
          <div className="relative grid grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col">
                <span className="font-display text-5xl italic text-nex-warm">
                  {s.n}
                </span>
                <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-nex-text">
                  {s.title}
                </p>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-nex-secondary">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 space-y-10 lg:hidden">
          {steps.map((s, i) => (
            <div key={s.n} className="border-l border-nex-blue/60 pl-6">
              <span className="font-display text-4xl italic text-nex-warm">
                {s.n}
              </span>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-nex-text">
                {s.title}
              </p>
              <p className="mt-2 font-sans text-sm font-light text-nex-secondary">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
