"use client";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { WaIcon } from "@/components/icons/WaIcon";
import { ParticleField } from "./ParticleField";
import styles from "./Hero.module.css";

export function Hero() {
  const { waLinks } = useSiteWa();
  return (
    <section id="hero" className={styles.section} data-st>
      <div className="bgr" aria-hidden="true" />
      <svg
        className={`${styles.deco} hpulse`}
        style={{ top: -100, right: -120, width: 500 }}
        viewBox="0 0 500 500"
        aria-hidden="true"
      >
        <polygon points="250,20 450,130 450,370 250,480 50,370 50,130" fill="none" stroke="#1B2F6E" strokeWidth="1.5" />
        <polygon points="250,60 420,160 420,340 250,440 80,340 80,160" fill="none" stroke="#1B2F6E" strokeWidth=".8" />
      </svg>
      <div className={styles.inner}>
        <div className={`${styles.grid} rv`}>
          <div>
            <div className={styles.eye}>Agencia tech · Durango</div>
            <h1 className={styles.title}>
              Tu negocio,
              <br />
              <span className="acc">digital</span>
              <br />
              y escalando.
            </h1>
            <p className={styles.sub}>
              Construimos el software que tu negocio necesita para dejar de hacer las cosas a mano y crecer sin límites
              técnicos.
            </p>
            <div className={styles.ctas}>
              <a href={waLinks.hero} className="btn-p" target="_blank" rel="noopener noreferrer">
                <WaIcon /> Hablemos de tu negocio
              </a>
              <a href="#servicios" className="btn-s">
                Ver servicios ↓
              </a>
            </div>
          </div>
          <div className={styles.hexVis}>
            <ParticleField />
          </div>
        </div>
      </div>
    </section>
  );
}
