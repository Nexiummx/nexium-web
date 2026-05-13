"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CALENDLY_URL } from "@/lib/site-constants";
import { EASE_NEX } from "@/lib/animations";

const lineEase = EASE_NEX;

export function HeroBrutal() {
  const reduce = useReducedMotion();

  const wordClip = reduce
    ? { opacity: 0 }
    : { clipPath: "inset(100% 0% 0% 0%)" };
  const wordVis = reduce
    ? { opacity: 1 }
    : { clipPath: "inset(0% 0% 0% 0%)" };

  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-nex-bg px-5 pb-16 pt-28 md:px-8 lg:px-16 lg:pb-24 lg:pt-32 xl:px-24">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-grid-hero bg-grid80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: reduce ? 0 : 0.6, duration: 0.9, ease: lineEase }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,720px)] w-[min(90vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(27,47,110,0.45)_0%,transparent_68%)] motion-safe:animate-glow-pulse"
        style={{ opacity: reduce ? 0.25 : undefined }}
      />
      <div className="nex-noise" aria-hidden />

      <motion.p
        className="relative z-[1] font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.2, duration: 0.6, ease: lineEase }}
      >
        Durango • MX — Agencia tech
      </motion.p>

      <div className="relative z-[1] mt-10 flex flex-1 flex-col justify-center">
        <h1 className="font-display font-normal tracking-tight text-nex-text [line-height:0.95]">
          <div className="flex flex-col">
            {["Construimos", "tecnología", "que"].map((word, i) => (
              <motion.span
                key={word}
                className="block text-[clamp(2.75rem,11vw,9rem)]"
                initial={wordClip}
                animate={wordVis}
                transition={{
                  delay: reduce ? 0 : 0.4 + i * 0.1,
                  duration: reduce ? 0.2 : 0.75,
                  ease: lineEase,
                }}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              className="block text-[clamp(2.75rem,11vw,9rem)] italic text-nex-warm"
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, skewX: "5deg" }
              }
              animate={
                reduce
                  ? { opacity: 1 }
                  : { opacity: 1, skewX: "0deg" }
              }
              transition={{
                delay: reduce ? 0 : 0.9,
                duration: 0.65,
                ease: lineEase,
              }}
            >
              vende.
            </motion.span>
          </div>
        </h1>
      </div>

      <div className="relative z-[1] mt-auto flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <motion.p
          className="max-w-md font-sans text-base font-light leading-relaxed text-nex-secondary md:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduce ? 0 : 1.2,
            duration: 0.65,
            ease: lineEase,
          }}
        >
          Para emprendedores que necesitan ir más rápido que la competencia.
        </motion.p>

        <div className="flex flex-col items-start gap-6 lg:items-end">
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduce ? 0 : 1.4,
              duration: 0.65,
              ease: lineEase,
            }}
          >
            <Link
              href="/proyectos"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-nex-blue px-8 py-3 font-mono text-xs font-medium uppercase tracking-widest text-nex-text transition-transform duration-300 ease-nex hover:scale-[1.02] hover:bg-nex-blueGlow"
              data-cursor-link
            >
              Ver proyectos →
            </Link>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-nex-warm/50 px-8 py-3 font-mono text-xs font-medium uppercase tracking-widest text-nex-text transition-colors duration-300 hover:bg-nex-warm/10"
              data-cursor-link
            >
              Agendar llamada
            </a>
          </motion.div>
          <motion.p
            className="font-mono text-xs uppercase tracking-[0.25em] text-nex-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 1.6, duration: 0.5 }}
          >
            EST. 2024
          </motion.p>
        </div>
      </div>
    </section>
  );
}
