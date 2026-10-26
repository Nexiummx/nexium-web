"use client";
import { useState } from "react";
import s from "./home.module.css";

const FAQS = [
  {
    q: "¿Cuánto cuesta una landing page?",
    a: "Una landing page informativa, que actualizamos nosotros cuando lo necesitas, suele estar entre $8,000 y $15,000 MXN. La primera llamada es gratis y sin compromiso; ahí te damos un número concreto.",
  },
  {
    q: "¿Y si quiero actualizar mi sitio yo mismo, o necesito un CRM o un panel administrativo?",
    a: "Eso ya es un sistema a la medida y se cotiza aparte, según lo que necesites administrar. Lo trabajamos por etapas: primero lo que más te urge y después lo demás, con un anticipo al inicio y el resto conforme ves avances funcionando.",
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
    a: "No. Podemos empezar desde cero: sin logo, sin dominio, sin hosting. Te orientamos en cada paso o lo gestionamos nosotros si prefieres no lidiar con eso.",
  },
  {
    q: "¿Qué incluye el servicio de consultoría?",
    a: "Un diagnóstico de tus procesos actuales, identificación de los 2-3 puntos donde la tecnología te puede ahorrar más tiempo o dinero, y una hoja de ruta priorizada. Te llevas un documento accionable, no una presentación bonita.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className={s.faq} data-st>
      <div className={s.faqHead}>
        <h2 className={s.h2} data-reveal>
          Tus dudas
        </h2>
        <p className={s.lead} data-reveal>
          Las preguntas que todos tienen pero pocos hacen en la primera llamada.
        </p>
      </div>
      <div className={s.faqList}>
        {FAQS.map(({ q, a }, i) => {
          const isOpen = open === i;
          return (
            <div key={q} className={`${s.faqItem} ${isOpen ? s.faqOpen : ""}`}>
              <h3>
                <button
                  type="button"
                  className={s.faqBtn}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {q}
                  <span className={s.faqIco} aria-hidden="true" />
                </button>
              </h3>
              <div id={`faq-${i}`} className={s.faqBody} role="region" aria-hidden={!isOpen}>
                <div>
                  <p>{a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
