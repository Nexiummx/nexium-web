"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoHorizontal } from "./icons/LogoHorizontal";
import { MobileMenu } from "./MobileMenu";
import { useSiteWa } from "@/components/SiteConfigProvider";
import styles from "./Header.module.css";

export function Header() {
  const { waLinks } = useSiteWa();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        id="hdr"
        role="banner"
        className={`${styles.hdr} ${scrolled ? styles.sc : ""}`}
      >
        <Link href="#hero" className={styles.logoA} aria-label="Nexium inicio">
          <LogoHorizontal height={34} />
        </Link>

        <nav className={styles.hn} role="navigation" aria-label="Principal">
          <a href="#servicios">Servicios</a>
          <a href="#como-trabajamos">Cómo trabajamos</a>
          <a href="#faq">FAQ</a>
          {waLinks && (
            <a
              href={waLinks.hero}
              className="btn-n"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hablemos por WhatsApp"
            >
              Hablemos →
            </a>
          )}
        </nav>

        <button
          type="button"
          className={styles.hbg}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="mob-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
