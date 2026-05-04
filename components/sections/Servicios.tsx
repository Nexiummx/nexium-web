"use client";
import { useMemo } from "react";
import { IcoWeb, IcoCons, IcoIa } from "@/components/icons/ServiceIcons";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { useTilt } from "@/components/lib/useTilt";
import type { WaLinks } from "@/lib/wa-links";
import styles from "./Servicios.module.css";

function buildServices(waLinks: WaLinks) {
  return [
    {
      Icon: IcoWeb,
      title: "Desarrollo web",
      desc: "Landing pages, sitios corporativos y aplicaciones web a medida. Código limpio, carga rápida y diseño que convierte.",
      href: waLinks.dev,
    },
    {
      Icon: IcoCons,
      title: "Consultoría de digitalización",
      desc: "Analizamos tus procesos e identificamos qué automatizar primero. Un plan concreto, no un reporte de 80 páginas.",
      href: waLinks.cons,
    },
    {
      Icon: IcoIa,
      title: "Integraciones con IA",
      desc: "Integramos IA en tu negocio para automatizar tareas y mejorar la eficiencia. Desde procesos de ventas hasta reportes de inventario.",
      href: waLinks.saas,
    },
  ];
}

interface ServiceCardProps {
  Icon: React.ComponentType;
  title: string;
  desc: string;
  href: string;
  index: number;
}

function ServiceCard({ Icon, title, desc, href, index }: ServiceCardProps) {
  const tiltRef = useTilt();
  return (
    <div ref={tiltRef} className={`${styles.card} rv d${index + 1}`}>
      <Icon />
      <h3>{title}</h3>
      <p>{desc}</p>
      <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
        Saber más →
      </a>
    </div>
  );
}

export function Servicios() {
  const { waLinks } = useSiteWa();
  const services = useMemo(() => buildServices(waLinks), [waLinks]);

  return (
    <section id="servicios" className={styles.section} data-st>
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
          <span className="slabel">Servicios</span>
          <h2>Qué hacemos</h2>
          <span className="srule" />
          <p>Tres áreas donde somos buenos de verdad. Si tu necesidad cae fuera, te lo decimos antes de cotizar.</p>
        </div>
        <div className={styles.grid}>
          {services.map((s, i) => (
            <ServiceCard key={s.title} {...s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
