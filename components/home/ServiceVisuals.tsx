"use client";
import { motion } from "framer-motion";
import s from "./home.module.css";

/* Desarrollo web: una página que se arma sola dentro de un navegador. */
export function WebVisual({ on }: { on: boolean }) {
  return (
    <div className={`${s.vis} ${s.web} ${on ? s.on : ""}`} aria-hidden="true">
      <div className={s.webBar}>
        <i />
        <i />
        <i />
        <span>tunegocio.mx</span>
      </div>
      <div className={s.webBody}>
        <div className={s.webNav} style={{ ["--d" as string]: "0ms" }}>
          <b />
          <span />
          <span />
          <span />
        </div>
        <div className={s.webHero}>
          <b style={{ ["--d" as string]: "120ms" }} />
          <b style={{ ["--d" as string]: "200ms" }} />
          <span style={{ ["--d" as string]: "280ms" }} />
          <em style={{ ["--d" as string]: "380ms" }}>Comprar ahora</em>
        </div>
        <div className={s.webCards}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ["--d" as string]: `${480 + i * 110}ms` }}>
              <figure />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Consultoría: procesos ordenados por las horas que cuestan cada semana. */
const TASKS = [
  { name: "Armar el reporte semanal", h: 3 },
  { name: "Capturar pedidos de WhatsApp", h: 9 },
  { name: "Enviar cotizaciones", h: 4 },
  { name: "Actualizar inventario", h: 7 },
  { name: "Conciliar pagos", h: 6 },
];
const MAX_H = 9;

export function ConsultVisual({ on }: { on: boolean }) {
  const list = on ? [...TASKS].sort((a, b) => b.h - a.h) : TASKS;
  return (
    <div className={`${s.vis} ${s.plan} ${on ? s.on : ""}`} aria-hidden="true">
      <div className={s.planHead}>
        <span>Diagnóstico de ejemplo</span>
        <span>horas a la semana</span>
      </div>
      <ul className={s.planList}>
        {list.map((t, i) => {
          const first = on && i < 3;
          return (
            <motion.li
              key={t.name}
              layout
              transition={{ type: "spring", stiffness: 260, damping: 30, delay: on ? 0.25 : 0 }}
              className={first ? s.planFirst : undefined}
            >
              <span className={s.planName}>{t.name}</span>
              <span className={s.planTrack}>
                <span className={s.planBar} style={{ transform: `scaleX(${on ? t.h / MAX_H : 0.08})` }} />
              </span>
              <span className={s.planH}>{t.h} h</span>
            </motion.li>
          );
        })}
      </ul>
      <p className={s.planFoot}>
        <span className={s.planBadge}>Primero</span> lo que más tiempo te quita
      </p>
    </div>
  );
}
