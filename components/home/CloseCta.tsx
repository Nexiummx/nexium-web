"use client";
import { useSiteWa } from "@/components/SiteConfigProvider";
import { WaIcon } from "@/components/icons/WaIcon";
import { EMAIL } from "@/lib/constants";
import s from "./home.module.css";

export function CloseCta() {
  const { waLinks } = useSiteWa();
  return (
    <section id="contacto" className={s.close} data-st>
      <svg className={s.closeMark} viewBox="0 0 1000 1000" aria-hidden="true" data-reveal>
        <path d="M500 112 L836 300 L836 700 L500 888 L164 700 L164 300 Z" />
        <path d="M571.31 540.11 L418.03 271.34 L214.75 700.85" />
        <path d="M777.05 309.46 L568.85 745.85 L415.57 491.42" />
        <path d="M343.44 665.2 L418.03 491.42" />
        <path d="M571.31 540.11 L636.89 357.33" />
      </svg>
      <h2 className={s.closeTitle} data-reveal>
        Hablemos de <span className={s.heroAcc}>tu negocio</span>
      </h2>
      <p className={s.closeSub} data-reveal>
        Una llamada de 30 minutos es suficiente para saber si podemos ayudarte, y si no, te decimos a quién acudir.
      </p>
      <div className={s.closeCtas} data-reveal>
        {waLinks && (
          <a href={waLinks.contact} className="btn-p" target="_blank" rel="noopener noreferrer">
            <WaIcon size={20} /> Escríbenos por WhatsApp
          </a>
        )}
        <a href={`mailto:${EMAIL}`} className="btn-s">
          {EMAIL}
        </a>
      </div>
    </section>
  );
}
