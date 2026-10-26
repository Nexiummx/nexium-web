"use client";
import { useEffect } from "react";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { NAV } from "./Header";
import styles from "./MobileMenu.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: Props) {
  const { waLinks } = useSiteWa();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav
      id="mob-menu"
      className={`${styles.sheet} ${open ? styles.open : ""}`}
      aria-label="Menú móvil"
      aria-hidden={!open}
    >
      {NAV.map((n, i) => (
        <a
          key={n.href}
          href={n.href}
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          style={{ ["--i" as string]: i }}
        >
          {n.label}
        </a>
      ))}
      {waLinks && (
        <a
          href={waLinks.hero}
          className="btn-p"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          style={{ ["--i" as string]: NAV.length }}
        >
          Hablemos por WhatsApp
        </a>
      )}
    </nav>
  );
}
