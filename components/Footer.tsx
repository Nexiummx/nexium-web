"use client";

import { LogoIcon } from "./icons/LogoIcon";
import { IgIcon, FbIcon, EmailIcon } from "./icons/SocialIcons";
import { WaIcon } from "./icons/WaIcon";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { EMAIL, IG_URL, FB_URL } from "@/lib/constants";
import styles from "./Footer.module.css";

export function Footer() {
  const { waNumber, waLinks } = useSiteWa();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.logoRow}>
            <LogoIcon height={32} />
            <span className={styles.wm}>Nexium</span>
          </div>
          <p className={styles.tg}>Ayudamos a negocios mexicanos a crecer con tecnología que funciona.</p>
          <div className={styles.soc}>
            <a href={IG_URL} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <IgIcon />
            </a>
            <a href={FB_URL} aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <FbIcon />
            </a>
          </div>
        </div>
        <div>
          <p className={styles.ch}>Navegación</p>
          <nav className={styles.nl} aria-label="Footer">
            <a href="#servicios">Servicios</a>
            <a href="#como-trabajamos">Cómo trabajamos</a>
            <a href="#faq">FAQ</a>
            <a href={waLinks.contact} target="_blank" rel="noopener noreferrer">
              Hablemos
            </a>
          </nav>
        </div>
        <div>
          <p className={styles.ch}>Contacto</p>
          <div className={styles.cl}>
            <a href={`mailto:${EMAIL}`}>
              <EmailIcon />
              {EMAIL}
            </a>
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
              <WaIcon size={14} />
              WhatsApp
            </a>
          </div>
          <p className={styles.loc}>Durango, México</p>
        </div>
      </div>
      <div className={styles.bot}>
        <p>© 2026 Nexium. Todos los derechos reservados.</p>
        <p style={{ color: "rgba(138,155,176,.3)", fontSize: 13 }}>nexiummx.com</p>
      </div>
    </footer>
  );
}
