"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EMAIL, FB_URL, IG_URL } from "@/lib/constants";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { EASE_NEX } from "@/lib/animations";

const footerNav = [
  { href: "/", label: "Inicio" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/servicios", label: "Servicios" },
  { href: "/contacto", label: "Contacto" },
];

const servicios = [
  "Desarrollo web",
  "Ecommerce",
  "Automatizaciones",
  "Consultoría digital",
];

export function Footer() {
  const { waNumber, waLinks } = useSiteWa();

  return (
    <footer className="relative overflow-hidden bg-nex-bg text-nex-text">
      <div className="relative border-t border-white/5 px-5 pb-12 pt-20 md:px-8 lg:px-16 xl:px-24">
        <motion.div
          className="pointer-events-none select-none text-center font-display text-[clamp(4rem,22vw,14rem)] font-normal leading-[0.85] text-outline-warm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: EASE_NEX }}
        >
          NEXIUM
        </motion.div>

        <div className="relative mx-auto mt-16 grid max-w-6xl gap-12 md:grid-cols-3 md:gap-8">
          <div>
            <p className="max-w-md font-display text-lg italic leading-relaxed text-nex-secondary md:text-xl">
              Agencia tech hecha por ingeniería, con criterio editorial.
              <br />
              Entregamos sin humo: alcance claro, código limpio, diseño con
              intención.
              <br />
              Durango como base; México y remoto como alcance.
              <br />
              Si valoras tu tiempo, ya hablamos el mismo idioma.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:contents">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
                Navegación
              </p>
              <ul className="space-y-2 font-mono text-sm text-nex-secondary">
                {footerNav.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="transition-colors hover:text-nex-text"
                      data-cursor-link
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mb-4 mt-8 font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
                Servicios
              </p>
              <ul className="space-y-1 font-mono text-xs text-nex-muted">
                {servicios.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
                Contacto
              </p>
              <ul className="space-y-3 font-mono text-sm text-nex-secondary">
                <li>
                  <a href={`mailto:${EMAIL}`} className="hover:text-nex-text" data-cursor-link>
                    {EMAIL}
                  </a>
                </li>
                {waLinks && (
                  <li>
                    <a
                      href={waLinks.contact}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-nex-text"
                      data-cursor-link
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
                {!waLinks && waNumber === "" && (
                  <li className="text-nex-muted">WhatsApp (configurar)</li>
                )}
                <li>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-nex-text"
                    data-cursor-link
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href={FB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-nex-text"
                    data-cursor-link
                  >
                    Facebook
                  </a>
                </li>
              </ul>
              <p className="mt-6 text-sm text-nex-muted">Durango, México</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-6xl border-t border-nex-blue/40 pt-6">
          <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="font-mono text-xs uppercase tracking-widest text-nex-muted">
              © {new Date().getFullYear()} NEXIUM · Hecho en Durango, México
            </p>
            <p className="font-mono text-xs text-nex-muted/80">v1.0.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
