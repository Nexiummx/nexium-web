"use client";
import { useEffect } from "react";
import { WA_LINKS } from "@/lib/constants";
import styles from "./MobileMenu.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav
      id="mob-menu"
      className={`${styles.draw} ${open ? styles.open : ""}`}
      role="navigation"
      aria-label="Menú móvil"
    >
      <a href="#servicios" onClick={onClose}>
        Servicios
      </a>
      <a href="#como-trabajamos" onClick={onClose}>
        Cómo trabajamos
      </a>
      <a href="#faq" onClick={onClose}>
        FAQ
      </a>
      <a
        href={WA_LINKS.hero}
        className="btn-n"
        style={{ fontSize: 22, padding: "18px 48px" }}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
      >
        Hablemos →
      </a>
    </nav>
  );
}
