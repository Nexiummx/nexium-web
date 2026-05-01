"use client";
import { useState } from "react";
import styles from "./FAQ.module.css";

const FAQS = [
  {
    q: "¿Cuánto cuesta una landing page?",
    a: "Depende del alcance, pero la mayoría de nuestros proyectos de landing page están entre $8,000 y $15,000 MXN. La primera llamada es gratis y sin compromiso — ahí te damos un número concreto.",
  },
  {
    q: "¿En cuánto tiempo está lista?",
    a: "Una landing page estándar: 2 a 3 semanas desde que tienes el contenido listo. Un sitio corporativo más complejo: 4 a 6 semanas. El cronograma lo defines tú con nosotros antes de empezar.",
  },
  {
    q: "¿Qué pasa si no sé qué necesito?",
    a: "Para eso existe nuestra consultoría de diagnóstico. En una sesión de 60 minutos entendemos tu negocio y te decimos exactamente qué herramienta digital te va a mover la aguja primero.",
  },
  {
    q: "¿Trabajan con negocios fuera de Durango?",
    a: "Sí, trabajamos con negocios en todo México. El 100% del proceso es remoto: llamadas por video, entregas por Drive y comunicación por WhatsApp. La distancia no ha sido un problema.",
  },
  {
    q: "¿Necesito tener algo previo para empezar?",
    a: "No. Podemos empezar desde cero — sin logo, sin dominio, sin hosting. Te orientamos en cada paso o lo gestionamos nosotros si prefieres no lidiar con eso.",
  },
  {
    q: "¿Qué incluye el servicio de consultoría?",
    a: "Un diagnóstico de tus procesos actuales, identificación de los 2-3 puntos donde la tecnología te puede ahorrar más tiempo o dinero, y una hoja de ruta priorizada. Te llevas un documento accionable, no una presentación bonita.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className={styles.section} data-st>
      <div className={`si ${styles.inner}`}>
        <div className="shdr rv">
          <span className="slabel">Preguntas frecuentes</span>
          <h2>FAQ</h2>
          <span className="srule srule-c" />
          <p>Las preguntas que todos tienen pero pocos hacen en la primera llamada.</p>
        </div>
        <div className={`${styles.list} rv`}>
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className={`${styles.item} ${open === i ? styles.open : ""}`}>
              <button
                type="button"
                className={styles.btn}
                aria-expanded={open === i}
                aria-controls={`faq-body-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {q}
                <span className={styles.ico} aria-hidden="true" />
              </button>
              <div id={`faq-body-${i}`} className={styles.body} role="region">
                <div className={styles.bodyI}>{a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
