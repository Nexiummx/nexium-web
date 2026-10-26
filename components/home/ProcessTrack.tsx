"use client";
import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import s from "./home.module.css";

const STEPS = [
  { n: "01", title: "Diagnóstico", desc: "Entendemos tu negocio, tus procesos y dónde está el cuello de botella real." },
  { n: "02", title: "Propuesta", desc: "Te mostramos el plan: qué construimos, en cuánto tiempo y cuánto cuesta. Sin letra pequeña." },
  { n: "03", title: "Desarrollo", desc: "Construimos con tu feedback activo. No desaparecemos 3 meses para aparecer con algo que no pediste." },
  { n: "04", title: "Entrega", desc: "Lanzamos y nos quedamos cerca. Si algo no funciona en las primeras semanas, lo arreglamos." },
];

export function ProcessTrack() {
  const list = useRef<HTMLOListElement>(null);
  const [reached, setReached] = useState(-1);
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 62%", "end 62%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Cada paso se enciende cuando la línea llega a su número.
    setReached(v <= 0 ? -1 : Math.min(STEPS.length - 1, Math.floor(v * STEPS.length + 0.15)));
  });

  return (
    <section id="como-trabajamos" className={s.proc} data-st>
      <div className={s.procHead}>
        <h2 className={s.h2} data-reveal>
          Cómo trabajamos
        </h2>
        <p className={s.lead} data-reveal>
          Sin metodologías inventadas. Solo cuatro pasos que se repiten en cada proyecto.
        </p>
      </div>
      <ol className={s.procList} ref={list}>
        <span className={s.procRail} aria-hidden="true">
          <motion.span className={s.procFill} style={{ scaleY: fill }} />
        </span>
        {STEPS.map((st, i) => (
          <li key={st.n} className={`${s.procStep} ${i <= reached ? s.procOn : ""}`}>
            <span className={s.procN} aria-hidden="true" />
            <div>
              <h3 className={s.procTitle}>{st.title}</h3>
              <p className={s.procDesc}>{st.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
