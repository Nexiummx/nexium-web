"use client";
import { useEffect, useState } from "react";
import { LogoIcon } from "./icons/LogoIcon";
import { MobileMenu } from "./MobileMenu";
import { useSiteWa } from "@/components/SiteConfigProvider";
import styles from "./Header.module.css";

export const NAV = [
  { href: "#servicios", label: "Servicios" },
  { href: "#como-trabajamos", label: "Cómo trabajamos" },
  { href: "#por-que", label: "Por qué Nexium" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const { waLinks } = useSiteWa();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        id="hdr"
        className={`${styles.hdr} ${scrolled || menuOpen ? styles.sc : ""}`}
      >
        <div className={styles.bar}>
          <a href="#hero" className={styles.logoA} aria-label="Nexium inicio">
            <LogoIcon height={30} />
            <span className={styles.wm}>Nexium</span>
          </a>

          <nav className={styles.hn} aria-label="Principal">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className={styles.end}>
            {waLinks && (
              <a
                href={waLinks.hero}
                className={styles.pill}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hablemos por WhatsApp"
              >
                Hablemos
              </a>
            )}
            <button
              type="button"
              className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ""}`}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              aria-controls="mob-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
