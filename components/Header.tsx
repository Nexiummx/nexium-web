"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { NexiumMark } from "./icons/NexiumMark";
import { CALENDLY_URL } from "@/lib/site-constants";
import { cn } from "@/lib/cn";
import { EASE_NEX, transitionPage } from "@/lib/animations";

const nav = [
  { href: "/", label: "Inicio" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/servicios", label: "Servicios" },
  { href: "/contacto", label: "Contacto" },
];

function DurangoClock() {
  const [now, setNow] = useState<string>("—");

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Mexico_City",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums text-nex-muted" suppressHydrationWarning>
      DURANGO, MX · {now}
    </span>
  );
}

function LogoWordmark({ className }: { className?: string }) {
  const letters = "NEXIUM".split("");
  const [scope, animate] = useAnimate();

  const play = async () => {
    for (let i = 0; i < letters.length; i++) {
      await animate(
        `[data-nx-l="${i}"]`,
        { opacity: 0.12 },
        { duration: 0.07, ease: EASE_NEX },
      );
    }
    for (let i = letters.length - 1; i >= 0; i--) {
      await animate(
        `[data-nx-l="${i}"]`,
        { opacity: 1 },
        { duration: 0.07, ease: EASE_NEX },
      );
    }
  };

  return (
    <motion.span
      ref={scope}
      className={cn("inline-flex items-center gap-0.5", className)}
      onHoverStart={play}
    >
      {letters.map((L, i) => (
        <span key={`${L}-${i}`} data-nx-l={i} className="inline-block">
          {L}
        </span>
      ))}
    </motion.span>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[1000] transition-[background,border-color,backdrop-filter] duration-500 ease-nex",
          scrolled
            ? "border-b border-white/10 bg-[rgba(13,13,13,0.85)] backdrop-blur-[20px]"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4 px-5 py-4 md:px-8 lg:px-16 xl:px-24">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 text-nex-text"
            aria-label="Nexium inicio"
            data-cursor-link
          >
            <NexiumMark className="size-7 shrink-0 text-nex-blueGlow" />
            <span className="font-mono text-base font-medium uppercase tracking-[0.3em]">
              <LogoWordmark />
            </span>
          </Link>

          <nav
            className="hidden items-center justify-center gap-10 lg:flex"
            aria-label="Principal"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-xs font-medium uppercase tracking-widest text-nex-secondary transition-colors duration-300 hover:text-nex-text"
                data-cursor-link
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-6 lg:flex">
            <DurangoClock />
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-nex-blue px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-widest text-nex-text transition-all duration-300 ease-nex hover:bg-nex-blue hover:text-nex-text min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              data-cursor-link
            >
              Agendar llamada
            </a>
          </div>

          <button
            type="button"
            className="relative z-[1002] flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <motion.span
              className="block h-px w-6 bg-nex-text"
              animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
              transition={transitionPage}
            />
            <motion.span
              className="block h-px w-6 bg-nex-text"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={transitionPage}
            />
            <motion.span
              className="block h-px w-6 bg-nex-text"
              animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
              transition={transitionPage}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[1001] bg-nex-bg lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_NEX }}
          >
            <nav
              className="flex h-full flex-col justify-center gap-8 px-8 pt-20"
              aria-label="Móvil"
            >
              {nav.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, ...transitionPage }}
                >
                  <Link
                    href={item.href}
                    className="font-mono text-sm uppercase tracking-[0.25em] text-nex-text"
                    onClick={() => setOpen(false)}
                    data-cursor-link
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full border border-nex-blue bg-nex-blue px-6 py-3 font-mono text-xs uppercase tracking-widest"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, ...transitionPage }}
                data-cursor-link
              >
                Agendar llamada
              </motion.a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
