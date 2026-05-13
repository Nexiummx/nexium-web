"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import projects from "@/src/data/projects.json";
import type { Project } from "@/lib/types/site";
import { EASE_NEX } from "@/lib/animations";

const list = projects as Project[];

export function FeaturedProjects() {
  return (
    <section className="bg-nex-bg px-5 py-24 md:px-8 md:py-32 lg:px-16 xl:px-24">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Trabajo reciente
        </p>
        <h2 className="mt-4 font-display text-5xl font-normal tracking-tight text-nex-text md:text-6xl lg:text-7xl [line-height:0.95]">
          Proyectos <em className="italic text-nex-warm">en producción.</em>
        </h2>
        <p className="mt-6 max-w-xl font-sans text-lg font-light text-nex-secondary">
          Cada uno construido a la medida del negocio.
        </p>

        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {list.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: EASE_NEX }}
              className="group flex flex-col overflow-hidden rounded-sm border border-white/10 bg-nex-surfaceAlt"
            >
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-[16/10] overflow-hidden"
                data-cursor-image
              >
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  fill
                  className="object-cover transition-transform duration-500 ease-nex group-hover:scale-[1.02]"
                  sizes="(max-width:1024px) 100vw, 33vw"
                />
                {/* SCREENSHOT: reemplazar por captura real del subdominio en producción (ver public/projects/README.txt) */}
              </a>
              <div className="flex flex-1 flex-col p-6 transition-transform duration-300 group-hover:-translate-y-1 md:p-8">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-nex-muted">
                  {p.categoria}
                </p>
                <h3 className="mt-3 font-display text-4xl text-nex-text md:text-5xl">
                  {p.nombre}
                </h3>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-nex-secondary">
                  {p.descripcion}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-nex-secondary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-nex-text transition-colors group-hover:text-nex-blueGlow"
                  data-cursor-link
                >
                  Visitar sitio →
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE_NEX }}
        >
          <Link
            href="/proyectos"
            className="link-nex font-mono text-xs uppercase tracking-[0.25em] text-nex-warm"
            data-cursor-link
          >
            Ver todos los proyectos →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
