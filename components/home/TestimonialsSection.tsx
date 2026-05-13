"use client";

/**
 * TODO: Reemplazar citas y datos con testimonios reales de clientes cuando estén disponibles.
 * El JSON `testimonials.json` es provisional para maquetar tono y layout.
 */

import Image from "next/image";
import { motion } from "framer-motion";
import testimonials from "@/src/data/testimonials.json";
import type { Testimonial } from "@/lib/types/site";
import { EASE_NEX } from "@/lib/animations";

const list = testimonials as Testimonial[];

export function TestimonialsSection() {
  return (
    <section className="border-t border-white/5 bg-nex-surfaceAlt px-5 py-24 md:px-8 md:py-32 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Lo que dicen
        </p>
        <h2 className="mt-4 font-display text-5xl font-normal md:text-6xl [line-height:0.95]">
          Voces <em className="italic text-nex-warm">de clientes.</em>
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {list.map((t, i) => (
            <motion.blockquote
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.65, ease: EASE_NEX }}
              className="flex flex-col border border-white/10 bg-nex-bg p-8"
            >
              <span className="font-display text-5xl italic leading-none text-nex-blue">
                “
              </span>
              <p className="mt-4 font-display text-lg italic leading-relaxed text-nex-text md:text-xl">
                {t.quote}
              </p>
              <footer className="mt-8 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-nex-surfaceAlt">
                  {t.imagen ? (
                    <Image src={t.imagen} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-nex-muted">
                      —
                    </span>
                  )}
                </div>
                <div>
                  <cite className="not-italic font-sans text-sm font-medium text-nex-text">
                    {t.nombre}
                  </cite>
                  <p className="font-mono text-xs text-nex-muted">{t.empresa}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
