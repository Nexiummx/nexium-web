"use client";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { motionValue, type MotionValue } from "framer-motion";
import { useSiteWa } from "@/components/SiteConfigProvider";
import type { WaLinks } from "@/lib/wa-links";
import { ConsultVisual, WebVisual } from "./ServiceVisuals";
import { AdminVisual, AiFlowVisual, CmsVisual, CrmVisual } from "./ServiceDemos";
import s from "./home.module.css";

type Service = {
  title: string;
  desc: string;
  link: keyof WaLinks;
  // "on": se arma al llegar. "scroll": avanza paso a paso conforme bajas.
  demo:
    | { kind: "on"; Visual: ComponentType<{ on: boolean }> }
    | { kind: "scroll"; Visual: ComponentType<{ p: MotionValue<number> }> };
};

const SERVICES: Service[] = [
  {
    title: "Desarrollo web",
    desc: "Landing pages, sitios corporativos y aplicaciones web a medida. Código limpio, carga rápida y diseño que convierte.",
    link: "dev",
    demo: { kind: "on", Visual: WebVisual },
  },
  {
    title: "CMS a la medida",
    desc: "Tu sitio con un panel hecho para tu negocio. Subes noticias, cambias fotos, precios y secciones, y programas promociones que aparecen y se quitan solas, sin depender de un programador.",
    link: "cms",
    demo: { kind: "scroll", Visual: CmsVisual },
  },
  {
    title: "CRM a la medida",
    desc: "Tus prospectos, clientes y seguimientos en un solo lugar, con las etapas de venta de tu negocio y no las de un software genérico.",
    link: "crm",
    demo: { kind: "scroll", Visual: CrmVisual },
  },
  {
    title: "Paneles administrativos",
    desc: "Un sistema interno para registrar clientes, pedidos, inventario o lo que tu operación necesite, con reportes al día y permisos por usuario. Adiós a los Excel sueltos.",
    link: "admin",
    demo: { kind: "scroll", Visual: AdminVisual },
  },
  {
    title: "Integraciones con IA",
    desc: "Integramos IA en tu negocio para automatizar tareas y mejorar la eficiencia. Por ejemplo, leer facturas y documentos y pasar los datos a tu sistema sin capturarlos a mano.",
    link: "saas",
    demo: { kind: "scroll", Visual: AiFlowVisual },
  },
  {
    title: "Consultoría de digitalización",
    desc: "Analizamos tus procesos e identificamos qué automatizar primero. Un plan concreto, no un reporte de 80 páginas.",
    link: "cons",
    demo: { kind: "on", Visual: ConsultVisual },
  },
];

function Demo({ service, on, p }: { service: Service; on: boolean; p: MotionValue<number> }) {
  const { demo } = service;
  return demo.kind === "on" ? <demo.Visual on={on} /> : <demo.Visual p={p} />;
}

export function ServiceScroll() {
  const { waLinks } = useSiteWa();
  const [active, setActive] = useState(-1);
  // En celular cada visual se queda armado una vez que se vio.
  const [seen, setSeen] = useState<boolean[]>(() => SERVICES.map(() => false));
  const items = useRef<(HTMLElement | null)[]>([]);
  // Avance de 0 a 1 de cada servicio mientras su texto cruza la pantalla.
  const progress = useRef(SERVICES.map(() => motionValue(0)));

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = Number((e.target as HTMLElement).dataset.index);
          setActive(i);
          setSeen((prev) => (prev[i] ? prev : prev.map((v, k) => v || k === i)));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    items.current.forEach((el) => el && obs.observe(el));

    let frame = 0;
    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
      items.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const v = (vh * 0.6 - r.top) / Math.max(1, r.height - vh * 0.3);
        progress.current[i].set(Math.min(1, Math.max(0, v)));
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const shown = Math.max(active, 0);

  return (
    <section id="servicios" className={s.svc} data-st>
      <div className={s.svcHead}>
        <h2 className={s.h2} data-reveal>
          Qué hacemos
        </h2>
        <p className={s.lead} data-reveal>
          Seis áreas donde somos buenos de verdad. Si tu necesidad cae fuera, te lo decimos antes de cotizar.
        </p>
      </div>

      <div className={s.svcGrid}>
        <div className={s.svcList}>
          {SERVICES.map((sv, i) => (
            <article
              key={sv.title}
              ref={(el) => {
                items.current[i] = el;
              }}
              data-index={i}
              className={`${s.svcItem} ${sv.demo.kind === "scroll" ? s.svcLong : ""} ${active === i ? s.svcActive : ""}`}
            >
              <div className={s.svcText}>
                <h3 className={s.svcTitle}>{sv.title}</h3>
                <p className={s.svcDesc}>{sv.desc}</p>
                <a
                  href={waLinks?.[sv.link] ?? "#contacto"}
                  className={s.textLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Saber más <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className={s.svcInline}>
                <Demo service={sv} on={seen[i]} p={progress.current[i]} />
              </div>
            </article>
          ))}
        </div>

        <div className={s.svcStage}>
          <div className={s.svcPanel}>
            {SERVICES.map((sv, i) => (
              <div key={sv.title} className={`${s.svcSlot} ${shown === i ? s.svcSlotOn : ""}`}>
                <Demo service={sv} on={shown === i} p={progress.current[i]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
