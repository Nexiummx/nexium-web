"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import services from "@/src/data/services.json";
import type { Service } from "@/lib/types/site";
import { EASE_NEX } from "@/lib/animations";
import { ServiceMockup } from "@/components/services/ServiceMockup";

const list = services as Service[];

export function ServicesGridHome() {
  return (
    <section className="border-t border-white/5 bg-nex-bg px-5 py-24 md:px-8 md:py-32 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Qué hacemos
        </p>
        <h2 className="mt-4 font-display text-5xl font-normal tracking-tight md:text-6xl lg:text-7xl [line-height:0.95]">
          Servicios <em className="italic text-nex-warm">a la medida.</em>
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {list.map((s, i) => {
            const n = String(i + 1).padStart(2, "0");
            return (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: (i % 2) * 0.08, duration: 0.65, ease: EASE_NEX }}
                className="group flex flex-col overflow-hidden border border-white/10 bg-nex-surfaceAlt transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-nex-blue"
              >
                <ServiceMockup service={s} variant="card" />
                <div className="p-8 pt-6">
                  <span className="font-display text-7xl leading-none text-transparent [text-stroke:1px_#E8D5B7] [-webkit-text-stroke:1px_#E8D5B7] transition-colors duration-300 group-hover:text-nex-warm group-hover:[-webkit-text-stroke-color:transparent]">
                    {n}
                  </span>
                  <h3 className="mt-4 font-sans text-2xl font-medium text-nex-text">
                    {s.nombre}
                  </h3>
                  <p className="mt-3 font-sans text-sm font-light leading-relaxed text-nex-secondary">
                    {s.descripcion}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {s.incluye.slice(0, 5).map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 font-sans text-sm text-nex-secondary"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-nex-blue" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/servicios"
                    className="mt-6 inline-flex font-mono text-xs uppercase tracking-widest text-nex-blueGlow transition-colors hover:text-nex-text"
                    data-cursor-link
                  >
                    Saber más →
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
