import { WA_LINKS, EMAIL } from "@/lib/constants";
import { WaIcon } from "@/components/icons/WaIcon";
import styles from "./Contacto.module.css";

export function Contacto() {
  return (
    <section id="contacto" className={styles.section} data-st>
      <div className="bgr" aria-hidden="true" />
      <div className={`${styles.inner} rv`}>
        <span className="slabel">Contacto</span>
        <h2>
          Hablemos de
          <br />
          <span className="acc">tu negocio</span>
        </h2>
        <p className={styles.sub}>
          Una llamada de 30 minutos es suficiente para saber si podemos ayudarte — y si no, te decimos a quién acudir.
        </p>
        <div className={styles.ctas}>
          <a
            href={WA_LINKS.contact}
            className="btn-p"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escríbenos por WhatsApp"
          >
            <WaIcon size={20} /> Escríbenos por WhatsApp
          </a>
        </div>
        <p className={styles.em}>
          o escríbenos a <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </div>
    </section>
  );
}
