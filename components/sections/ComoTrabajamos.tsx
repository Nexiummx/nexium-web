"use client";
import { useEffect, useRef } from "react";
import styles from "./ComoTrabajamos.module.css";

const STEPS = [
  { n: "01", title: "Diagnóstico", desc: "Entendemos tu negocio, tus procesos y dónde está el cuello de botella real." },
  { n: "02", title: "Propuesta", desc: "Te mostramos el plan: qué construimos, en cuánto tiempo y cuánto cuesta. Sin letra pequeña." },
  { n: "03", title: "Desarrollo", desc: "Construimos con tu feedback activo. No desaparecemos 3 meses para aparecer con algo que no pediste." },
  { n: "04", title: "Entrega", desc: "Lanzamos y nos quedamos cerca. Si algo no funciona en las primeras semanas, lo arreglamos." },
];

const HEX_STEP = "32,2 58,17 58,47 32,62 6,47 6,17";

export function ComoTrabajamos() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = document.querySelector(`.${styles.row}`);
    if (!row) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && fillRef.current) {
          fillRef.current.style.width = "100%";
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(row);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="como-trabajamos" className={styles.section} data-st>
      <div className={`si ${styles.inner}`}>
        <div className="shdr rv">
          <span className="slabel">Proceso</span>
          <h2>Cómo trabajamos</h2>
          <span className="srule srule-c" />
          <p>Sin metodologías inventadas. Solo cuatro pasos que se repiten en cada proyecto.</p>
        </div>
        <div className={styles.row}>
          <div className={styles.line}>
            <div ref={fillRef} className={styles.lineFill} />
          </div>
          {STEPS.map(({ n, title, desc }, i) => (
            <div key={n} className={`${styles.step} rv d${i + 1}`}>
              <div className={styles.hex}>
                <svg className={styles.hexBg} viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <polygon points={HEX_STEP} fill="rgba(27,47,110,.15)" stroke="#1B2F6E" strokeWidth="1.5" />
                </svg>
                <div className={styles.hexN}>{n}</div>
              </div>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
