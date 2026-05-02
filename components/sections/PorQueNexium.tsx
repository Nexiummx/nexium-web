"use client";
import { useTilt } from "@/components/lib/useTilt";
import styles from "./PorQueNexium.module.css";

const HEX = "24,2 44,13 44,35 24,46 4,35 4,13";

const REASONS = [
  {
    title: "Velocidad sin atajos",
    desc: "Entregamos rápido porque tenemos el proceso claro, no porque cortemos esquinas. Tus plazos los cumplimos o los renegociamos antes, no después.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <polygon points={HEX} stroke="#1B2F6E" strokeWidth="1.5" fill="rgba(27,47,110,.12)" />
        <path
          d="M18 24h8l-3-6 8 6-8 0 3 6z"
          stroke="#8A9BB0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    title: "Transparencia total",
    desc: "Sabes el precio y los tiempos antes de firmar. Si algo cambia en el camino, te lo decimos de frente — nunca en la factura final.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <polygon points={HEX} stroke="#1B2F6E" strokeWidth="1.5" fill="rgba(27,47,110,.12)" />
        <circle cx="24" cy="24" r="7" stroke="#8A9BB0" strokeWidth="1.5" fill="none" />
        <circle cx="24" cy="24" r="2" fill="#1B2F6E" />
        <path d="M24 13v3M24 32v3M13 24h3M32 24h3" stroke="#8A9BB0" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Stack que escala",
    desc: "Usamos las mismas tecnologías que usan las empresas que quieres parecer. Lo que construimos hoy no te frena mañana cuando crezcas.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <polygon points={HEX} stroke="#1B2F6E" strokeWidth="1.5" fill="rgba(27,47,110,.12)" />
        <rect x="16" y="26" width="6" height="8" rx="1" stroke="#8A9BB0" strokeWidth="1.4" fill="none" />
        <rect x="21" y="20" width="6" height="14" rx="1" stroke="#8A9BB0" strokeWidth="1.4" fill="none" />
        <rect x="26" y="16" width="6" height="18" rx="1" stroke="#8A9BB0" strokeWidth="1.4" fill="none" />
      </svg>
    ),
  },
];

interface ReasonCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  index: number;
}

function ReasonCard({ title, desc, icon, index }: ReasonCardProps) {
  const tiltRef = useTilt();
  return (
    <div ref={tiltRef} className={`${styles.item} rv d${index + 1}`}>
      <div className={styles.ico}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export function PorQueNexium() {
  return (
    <section id="por-que" className={styles.section} data-st>
      <svg
        className="hexBorder"
        style={{ top: 40, right: 40, width: 180 }}
        viewBox="0 0 180 180"
        aria-hidden="true"
      >
        <polygon
          points="90,10 165,52 165,128 90,170 15,128 15,52"
          fill="none"
          stroke="#1B2F6E"
          strokeWidth="1"
        />
        <polygon
          points="90,30 145,62 145,118 90,150 35,118 35,62"
          fill="none"
          stroke="#1B2F6E"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </svg>
      <div className={`si ${styles.inner}`}>
        <div className="shdr-l rv">
          <span className="slabel">Por qué nosotros</span>
          <h2>Por qué Nexium</h2>
          <span className="srule" />
          <p>Hay cientos de agencias. Estas son las razones concretas por las que algunos nos eligen.</p>
        </div>
        <div className={styles.grid}>
          {REASONS.map((r, i) => (
            <ReasonCard key={r.title} {...r} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
