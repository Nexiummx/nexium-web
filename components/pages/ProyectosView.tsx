"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import projects from "@/src/data/projects.json";
import type { Project } from "@/lib/types/site";
import { CALENDLY_URL } from "@/lib/site-constants";
import { EASE_NEX } from "@/lib/animations";

const list = projects as Project[];

const tabs = ["TODOS", "WEB", "ECOMMERCE", "AUTOMATIZACIÓN"] as const;

function ProjectRow({ p, index }: { p: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-12, 12]);

  const num = String(index + 1).padStart(3, "0");

  return (
    <motion.article
      ref={ref}
      className="group border-b border-white/10 pb-20 pt-12 last:border-b-0"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease: EASE_NEX }}
    >
      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[16/9] w-full overflow-hidden border border-white/10 bg-nex-surfaceAlt"
        data-cursor-image
      >
        <motion.div className="relative h-full w-full" style={{ y }}>
          <Image
            src={p.imagen}
            alt={p.nombre}
            fill
            className="object-cover transition-transform duration-500 ease-nex group-hover:scale-[1.02]"
            sizes="100vw"
            priority={index === 0}
          />
        </motion.div>
      </a>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="font-mono text-xs text-nex-muted">{num}</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-nex-secondary">
            {p.categoria}
          </p>
          <p className="mt-4 font-mono text-xs text-nex-muted">{p.year}</p>
        </div>
        <div>
          <h2 className="font-display text-5xl tracking-tight text-nex-text md:text-6xl [line-height:0.95]">
            {p.nombre}
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-base font-light leading-relaxed text-nex-secondary">
            {p.descripcion}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {p.tech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-nex-muted"
              >
                {t}
              </span>
            ))}
          </div>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-widest text-nex-blueGlow transition-colors hover:text-nex-text"
            data-cursor-link
          >
            Visitar →
          </a>
        </div>
      </div>
    </motion.article>
  );
}

const pipeline = [
  { title: "Retail · norte", eta: "Q1 2026" },
  { title: "SaaS interno", eta: "Q1 2026" },
  { title: "Marca hospitality", eta: "Q2 2026" },
];

export function ProyectosView() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("TODOS");

  const filtered = useMemo(() => {
    if (tab === "TODOS") return list;
    if (tab === "WEB") return list;
    if (tab === "ECOMMERCE") return list.filter((p) => p.id === "lina");
    if (tab === "AUTOMATIZACIÓN") return [];
    return list;
  }, [tab]);

  return (
    <>
      <ScrollProgressBar />
      <section className="flex min-h-[50vh] flex-col justify-end px-5 pb-16 pt-32 md:px-8 lg:px-16 xl:px-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Trabajo reciente
        </p>
        <h1 className="mt-4 font-display text-[clamp(3.5rem,12vw,10rem)] font-normal leading-[0.9] tracking-tight">
          Proyectos.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg font-light text-nex-secondary">
          Cada uno una solución distinta a un problema distinto.
        </p>
      </section>

      <div className="border-y border-white/5 px-5 py-6 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-[44px] rounded-full border px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === t
                  ? "border-nex-blue bg-nex-blue/20 text-nex-text"
                  : "border-white/10 text-nex-muted hover:border-nex-blue/50 hover:text-nex-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-24 md:px-8 lg:px-16 xl:px-24">
        {filtered.map((p, i) => (
          <ProjectRow key={p.id} p={p} index={i} />
        ))}
        {filtered.length === 0 ? (
          <p className="py-16 font-mono text-sm text-nex-muted">
            Sin proyectos en esta categoría todavía.
          </p>
        ) : null}
      </div>

      <section className="border-t border-white/5 bg-nex-surfaceAlt px-5 py-20 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
            En proceso
          </p>
          <h2 className="mt-4 font-display text-3xl text-nex-text md:text-4xl">
            Pipeline activo
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pipeline.map((x) => (
              <div
                key={x.title}
                className="border border-dashed border-white/15 bg-nex-bg/40 p-8"
              >
                <p className="font-mono text-xs text-nex-muted">{x.eta}</p>
                <p className="mt-4 font-sans text-lg text-nex-text">{x.title}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-nex-muted">
                  Coming soon
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 text-center md:px-8 lg:px-16 xl:px-24">
        <h2 className="font-display text-3xl text-nex-text md:text-4xl">
          ¿Tu proyecto podría ser el siguiente?
        </h2>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-nex-blue px-10 py-3 font-mono text-xs uppercase tracking-widest text-nex-text transition-transform hover:scale-[1.02]"
          data-cursor-link
        >
          Agendar llamada
        </a>
        <p className="mt-6">
          <Link
            href="/contacto"
            className="font-mono text-xs uppercase tracking-widest text-nex-secondary underline-offset-4 hover:text-nex-text"
            data-cursor-link
          >
            O escríbenos desde contacto →
          </Link>
        </p>
      </section>
    </>
  );
}
