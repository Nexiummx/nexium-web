"use client";

import { motion } from "framer-motion";
import { CALENDLY_URL } from "@/lib/site-constants";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { EASE_NEX } from "@/lib/animations";

export function CtaFinalSection() {
  const { waLinks } = useSiteWa();

  return (
    <section className="bg-nex-surfaceLight px-5 py-24 text-nex-onLight md:px-8 md:py-28 lg:px-16 xl:px-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[3fr_2fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: EASE_NEX }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blue">
            ¿Listo para empezar?
          </p>
          <h2 className="mt-4 font-display text-5xl font-normal tracking-tight md:text-6xl lg:text-7xl [line-height:0.95]">
            Cuéntanos <em className="italic text-nex-blue">tu proyecto.</em>
          </h2>
          <p className="mt-6 max-w-md font-sans text-lg font-light text-nex-onLight/80">
            30 minutos. Sin compromiso. Sin venta dura.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.1, duration: 0.7, ease: EASE_NEX }}
        >
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-nex-blue px-8 py-4 font-mono text-xs font-medium uppercase tracking-widest text-nex-text transition-transform duration-300 hover:scale-[1.02]"
            data-cursor-link
          >
            Agendar llamada →
          </a>
          {waLinks ? (
            <a
              href={waLinks.contact}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center font-mono text-xs uppercase tracking-widest text-nex-onLight/70 underline-offset-4 transition-colors hover:text-nex-blue"
              data-cursor-link
            >
              Escríbenos por WhatsApp
            </a>
          ) : (
            <p className="text-center font-mono text-xs text-nex-onLight/50">
              WhatsApp: configurar WA_NUMBER en entorno
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
