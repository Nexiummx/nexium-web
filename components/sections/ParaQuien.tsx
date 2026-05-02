import styles from "./ParaQuien.module.css";

const HEX_SMALL = "24,3 42,13 42,35 24,45 6,35 6,13";

export function ParaQuien() {
  return (
    <section id="para-quien" className={styles.section} data-st>
      <svg
        className="hexBorder"
        style={{ top: 40, left: 40, width: 180, transform: "rotate(30deg)" }}
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
        <div className="shdr rv">
          <span className="slabel">Para quién</span>
          <h2>¿Es Nexium para ti?</h2>
          <span className="srule srule-c" />
          <p>No trabajamos con todos — y eso es a propósito. Aquí va la verdad sin rodeos.</p>
        </div>
        <div className={styles.grid}>
          <div className={`${styles.card} ${styles.yes} rv d1`}>
            <span className={`${styles.tag} ${styles.tagY}`}>✓ Para ti</span>
            <div className={styles.ico} aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <polygon points={HEX_SMALL} stroke="#1B2F6E" strokeWidth="1.5" fill="rgba(27,47,110,.12)" />
                <path
                  d="M16 24l5 5 10-10"
                  stroke="#8A9BB0"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Tienes un negocio que ya funciona</h3>
            <p>
              Ya vendes, ya tienes clientes, pero dependes de procesos manuales y herramientas que no se hablan entre sí.
              Quieres que eso cambie.
            </p>
          </div>
          <div className={`${styles.card} ${styles.yes} rv d2`}>
            <span className={`${styles.tag} ${styles.tagY}`}>✓ Para ti</span>
            <div className={styles.ico} aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <polygon points={HEX_SMALL} stroke="#1B2F6E" strokeWidth="1.5" fill="rgba(27,47,110,.12)" />
                <circle cx="24" cy="20" r="5" stroke="#8A9BB0" strokeWidth="1.5" fill="none" />
                <path
                  d="M13 37c0-6 5-11 11-11s11 5 11 11"
                  stroke="#8A9BB0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <h3>Quieres lanzar algo nuevo</h3>
            <p>
              Tienes una idea clara y sabes a quién le vendes. Necesitas a alguien que la construya bien, rápido y sin
              sorpresas en el precio.
            </p>
          </div>
          <div className={`${styles.card} ${styles.no} rv d3`}>
            <span className={`${styles.tag} ${styles.tagN}`}>✗ No es para ti</span>
            <div className={styles.ico} aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <polygon
                  points={HEX_SMALL}
                  stroke="rgba(138,155,176,.35)"
                  strokeWidth="1.5"
                  fill="rgba(138,155,176,.05)"
                />
                <path
                  d="M17 17l14 14M31 17L17 31"
                  stroke="rgba(138,155,176,.45)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>Buscas el precio más bajo del mercado</h3>
            <p>
              Cobramos justo por hacer las cosas bien. Si el único criterio es el costo, hay mejores opciones para ti y
              somos honestos al respecto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
