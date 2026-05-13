"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_NEX } from "@/lib/animations";

const profiles = [
  {
    title: "Emprendedores arrancando",
    body: "Necesitas presencia digital que comunique valor sin reventar el presupuesto.",
    icon: "01",
  },
  {
    title: "Negocios con tracción",
    body: "Tu operación crece y el Excel ya no alcanza: automatizamos lo repetible.",
    icon: "02",
  },
  {
    title: "Marcas establecidas",
    body: "Rediseño, performance y nuevos canales para sostener el crecimiento.",
    icon: "03",
  },
];

export function AudienceSection() {
  return (
    <section className="bg-nex-bg px-5 py-24 md:px-8 md:py-32 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Para quién
        </p>
        <h2 className="mt-4 max-w-4xl font-display text-4xl font-normal leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
          ¿Eres dueño de un negocio que{" "}
          <em className="italic text-nex-warm">valora su tiempo?</em>
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.65, ease: EASE_NEX }}
              className="flex flex-col border border-white/10 bg-nex-surfaceAlt p-8"
            >
              <span className="font-mono text-xs text-nex-muted">{p.icon}</span>
              <div className="mt-4 h-px w-full bg-nex-warm/20" />
              <h3 className="mt-6 font-sans text-xl font-medium text-nex-text">
                {p.title}
              </h3>
              <p className="mt-3 font-sans text-sm font-light leading-relaxed text-nex-secondary">
                {p.body}
              </p>
              <Link
                href="/contacto"
                className="mt-8 inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-widest text-nex-blueGlow transition-colors hover:text-nex-text"
                data-cursor-link
              >
                Eso es para mí →
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
