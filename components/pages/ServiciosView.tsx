"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import services from "@/src/data/services.json";
import type { Service } from "@/lib/types/site";
import { CALENDLY_URL } from "@/lib/site-constants";
import { EASE_NEX } from "@/lib/animations";
import { ServiceMockup } from "@/components/services/ServiceMockup";

const list = services as Service[];

export function ServiciosView() {
  return (
    <>
      <section className="flex min-h-[50vh] flex-col justify-end px-5 pb-16 pt-32 md:px-8 lg:px-16 xl:px-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Servicios
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-normal leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
          Qué hacemos <em className="italic text-nex-warm">exactamente.</em>
        </h1>
      </section>

      {list.map((s, i) => {
        const n = String(i + 1).padStart(2, "0");
        const invert = i % 2 === 1;
        return (
          <section
            key={s.id}
            className={`border-t border-white/5 px-5 py-20 md:px-8 md:py-28 lg:px-16 xl:px-24 ${
              i % 2 === 0 ? "bg-nex-bg" : "bg-nex-surfaceAlt"
            }`}
          >
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: EASE_NEX }}
                className={invert ? "lg:order-2" : ""}
              >
                <span className="font-display text-[clamp(5rem,18vw,10rem)] leading-none text-nex-warm/25">
                  {n}
                </span>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
                  {s.id === "web"
                    ? "Producto digital"
                    : s.id === "ecommerce"
                      ? "Ventas online"
                      : s.id === "auto"
                        ? "Operaciones"
                        : "Estrategia"}
                </p>
                <h2 className="mt-4 font-display text-4xl text-nex-text md:text-5xl">
                  {s.nombre}
                </h2>
                <p className="mt-6 font-sans text-base font-light leading-relaxed text-nex-secondary">
                  {s.descripcion}
                </p>
                <ul className="mt-8 space-y-3">
                  {s.incluye.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 font-sans text-sm text-nex-secondary"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-nex-blue" />
                      {item}
                    </li>
                  ))}
                </ul>
                {s.casosUso && s.casosUso.length > 0 ? (
                  <div className="mt-8 border-l border-nex-blue/40 pl-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-nex-muted">
                      Casos de uso
                    </p>
                    <ul className="mt-3 space-y-2 font-sans text-sm text-nex-text">
                      {s.casosUso.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="mt-10 font-mono text-sm text-nex-warm">
                  {s.precioPlaceholder}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.08, duration: 0.7, ease: EASE_NEX }}
                className={`group ${invert ? "lg:order-1" : ""}`}
              >
                <ServiceMockup service={s} variant="page" />
              </motion.div>
            </div>
          </section>
        );
      })}

      <section className="border-t border-white/5 px-5 py-24 text-center md:px-8 lg:px-16 xl:px-24">
        <h2 className="font-display text-3xl md:text-4xl">
          Hablemos de tu proyecto
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/contacto"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-nex-warm/40 px-8 py-3 font-mono text-xs uppercase tracking-widest text-nex-text transition-colors hover:bg-nex-warm/10"
            data-cursor-link
          >
            Ir a contacto
          </Link>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-nex-blue px-8 py-3 font-mono text-xs uppercase tracking-widest text-nex-text transition-transform hover:scale-[1.02]"
            data-cursor-link
          >
            Agendar llamada
          </a>
        </div>
      </section>
    </>
  );
}
