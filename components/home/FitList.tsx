import s from "./home.module.css";

const ROWS = [
  {
    fit: true,
    title: "Tienes un negocio que ya funciona",
    desc: "Ya vendes, ya tienes clientes, pero dependes de procesos manuales y herramientas que no se hablan entre sí. Quieres que eso cambie.",
  },
  {
    fit: true,
    title: "Quieres lanzar algo nuevo",
    desc: "Tienes una idea clara y sabes a quién le vendes. Necesitas a alguien que la construya bien, rápido y sin sorpresas en el precio.",
  },
  {
    fit: false,
    title: "Buscas el precio más bajo del mercado",
    desc: "Cobramos justo por hacer las cosas bien. Si el único criterio es el costo, hay mejores opciones para ti y somos honestos al respecto.",
  },
];

export function FitList() {
  return (
    <section id="para-quien" className={s.fit} data-st>
      <div className={s.fitHead}>
        <h2 className={s.h2} data-reveal>
          ¿Es Nexium para ti?
        </h2>
        <p className={s.lead} data-reveal>
          No trabajamos con todos, y eso es a propósito. Aquí va la verdad sin rodeos.
        </p>
      </div>
      <ol className={s.fitList}>
        {ROWS.map((r, i) => (
          <li key={r.title} className={r.fit ? s.fitRow : `${s.fitRow} ${s.fitNo}`} data-reveal style={{ ["--i" as string]: i }}>
            <span className={s.fitMark} aria-hidden="true">
              {r.fit ? (
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
                </svg>
              )}
            </span>
            <span className="sr">{r.fit ? "Para ti: " : "No es para ti: "}</span>
            <h3 className={s.fitTitle}>{r.title}</h3>
            <p className={s.fitDesc}>{r.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
