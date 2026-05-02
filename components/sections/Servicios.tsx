import { IcoWeb, IcoCons, IcoIa } from "@/components/icons/ServiceIcons";
import { WA_LINKS } from "@/lib/constants";
import styles from "./Servicios.module.css";

const SERVICES = [
  {
    Icon: IcoWeb,
    title: "Desarrollo web",
    desc: "Landing pages, sitios corporativos y aplicaciones web a medida. Código limpio, carga rápida y diseño que convierte.",
    href: WA_LINKS.dev,
  },
  {
    Icon: IcoCons,
    title: "Consultoría de digitalización",
    desc: "Analizamos tus procesos e identificamos qué automatizar primero. Un plan concreto, no un reporte de 80 páginas.",
    href: WA_LINKS.cons,
  },
  {
    Icon: IcoIa,
    title: "Integraciones con IA",
    desc: "Integramos IA en tu negocio para automatizar tareas y mejorar la eficiencia. Desde procesos de ventas hasta reportes de inventario.",
    href: WA_LINKS.saas,
  },
];

export function Servicios() {
  return (
    <section id="servicios" className={styles.section} data-st>
      <div className={`si ${styles.inner}`}>
        <div className="shdr rv">
          <span className="slabel">Servicios</span>
          <h2>Qué hacemos</h2>
          <span className="srule srule-c" />
          <p>Tres áreas donde somos buenos de verdad. Si tu necesidad cae fuera, te lo decimos antes de cotizar.</p>
        </div>
        <div className={styles.grid}>
          {SERVICES.map(({ Icon, title, desc, href }, i) => (
            <div key={title} className={`${styles.card} rv d${i + 1}`}>
              <Icon />
              <h3>{title}</h3>
              <p>{desc}</p>
              <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                Saber más →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
