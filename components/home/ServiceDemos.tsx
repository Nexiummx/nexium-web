"use client";
import { useState } from "react";
import { LayoutGroup, motion, useMotionValueEvent, type MotionValue } from "framer-motion";
import s from "./home.module.css";

// Demos que avanzan con el scroll: cada una recibe el avance de 0 a 1 de su servicio.
function useAdvance(p: MotionValue<number>) {
  const [v, setV] = useState(p.get());
  useMotionValueEvent(p, "change", (next) => {
    const rounded = Math.round(next * 100) / 100;
    setV((prev) => (prev === rounded ? prev : rounded));
  });
  return v;
}
const span = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/* ───────── CMS: editas en el panel y el sitio cambia al lado ───────── */
const NEWS_TITLE = "Escápate este fin de semana";

function Landscape({ warm }: { warm: boolean }) {
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="90" fill={warm ? "#f2c879" : "#3a4d86"} />
      <circle cx="122" cy="26" r="11" fill={warm ? "#fff3d6" : "#c9d4ff"} />
      <path d="M0 70 L44 38 L78 64 L104 46 L160 74 V90 H0 Z" fill={warm ? "#d98c3f" : "#26355f"} />
      <path d="M0 80 L60 60 L120 78 L160 70 V90 H0 Z" fill={warm ? "#a85f2a" : "#1b2748"} />
    </svg>
  );
}

export function CmsVisual({ p }: { p: MotionValue<number> }) {
  const v = useAdvance(p);
  const typed = NEWS_TITLE.slice(0, Math.round(span(v, 0.1, 0.3) * NEWS_TITLE.length));
  const warm = v > 0.42;
  const promo = v > 0.6;
  const published = v > 0.8;
  const stage = v < 0.1 ? 0 : v < 0.36 ? 1 : v < 0.56 ? 2 : v < 0.76 ? 3 : 4;
  const cursorAt = ["14%", "22%", "44%", "64%", "86%"][stage];

  return (
    <div className={`${s.vis} ${s.cms}`} aria-hidden="true">
      <div className={s.cmsAdmin}>
        <div className={s.cmsTop}>
          <b>Panel</b>
          <span>Promociones</span>
        </div>
        <div className={s.cmsField}>
          <span>Título</span>
          <div className={`${s.cmsInput} ${stage === 1 ? s.cmsFocus : ""}`}>
            {typed}
            {stage === 1 && <i className={s.caret} />}
          </div>
        </div>
        <div className={s.cmsField}>
          <span>Foto</span>
          <div className={s.cmsThumbs}>
            <div className={!warm ? s.cmsPicked : undefined}>
              <Landscape warm={false} />
            </div>
            <div className={warm ? s.cmsPicked : undefined}>
              <Landscape warm />
            </div>
          </div>
        </div>
        <div className={s.cmsField}>
          <span>Precio por noche</span>
          <div className={`${s.cmsInput} ${stage === 3 ? s.cmsFocus : ""}`}>{promo ? "$1,490" : "$1,850"}</div>
        </div>
        <div className={s.cmsPublish}>
          <span>Se quita sola el domingo</span>
          <b className={published ? s.on : undefined}>{published ? "Publicado" : "Publicar"}</b>
        </div>
        <i className={s.cursor} style={{ top: cursorAt, opacity: published ? 0 : 1 }} />
      </div>

      <div className={s.cmsSite}>
        <div className={s.cmsBar}>cabañasdelasierra.mx</div>
        <div className={s.cmsHero}>
          <Landscape warm={warm} />
          {published && <em className={s.cmsBadge}>Nuevo</em>}
        </div>
        <div className={s.cmsCopy}>
          <b>{typed || "Cabañas de la Sierra"}</b>
          <span>
            Por noche <strong>{promo ? "$1,490" : "$1,850"}</strong>
            {promo && <em>Promo</em>}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────── CRM: los prospectos avanzan por tus etapas de venta ───────── */
const STAGES = ["Prospecto", "Cotización", "Cliente"];

export function CrmVisual({ p }: { p: MotionValue<number> }) {
  const v = useAdvance(p);
  const cards = [
    { id: "ana", name: "Ana Ruiz", note: "Boda · 120 invitados", col: v > 0.2 ? 1 : 0 },
    { id: "taller", name: "Taller Méndez", note: "Uniformes", col: v > 0.42 ? 2 : 1 },
    { id: "clinica", name: "Clínica Sol", note: "Renovación anual", col: 2 },
    ...(v > 0.62 ? [{ id: "luis", name: "Luis Pardo", note: "Llegó por WhatsApp", col: 0, fresh: true }] : []),
  ];
  const total = v > 0.42 ? "$48,500" : "$36,200";

  return (
    <div className={`${s.vis} ${s.crm}`} aria-hidden="true">
      <div className={s.crmHead}>
        <span>Vendido este mes</span>
        <motion.b key={total} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {total}
        </motion.b>
      </div>
      <LayoutGroup>
        <div className={s.crmBoard}>
          {STAGES.map((stage, col) => (
            <div key={stage} className={s.crmCol}>
              <span className={s.crmColName}>{stage}</span>
              {cards
                .filter((c) => c.col === col)
                .map((c) => (
                  <motion.div
                    key={c.id}
                    layoutId={c.id}
                    initial={"fresh" in c ? { opacity: 0, scale: 0.9 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                    className={`${s.crmCard} ${col === 2 ? s.crmWon : ""}`}
                  >
                    <b>{c.name}</b>
                    <span>{c.note}</span>
                  </motion.div>
                ))}
            </div>
          ))}
        </div>
      </LayoutGroup>
      <div className={`${s.crmToast} ${v > 0.8 ? s.on : ""}`}>
        <i />
        Recordatorio: llamar a Ana mañana a las 10:00
      </div>
    </div>
  );
}

/* ───────── IA: un documento entra, la IA lo lee y los datos llegan a tu sistema ───────── */
const FIELDS = [
  { k: "Proveedor", v: "Textiles del Norte" },
  { k: "Fecha", v: "14 oct 2026" },
  { k: "Folio", v: "A-2291" },
  { k: "Total", v: "$12,480.00" },
];

export function AiFlowVisual({ p }: { p: MotionValue<number> }) {
  const v = useAdvance(p);
  const scan = span(v, 0.08, 0.3);
  const reading = v > 0.08 && v < 0.34;
  const shownFields = Math.round(span(v, 0.4, 0.62) * FIELDS.length);
  const done = v > 0.76;

  return (
    <div className={`${s.vis} ${s.flow}`} aria-hidden="true">
      <div className={s.flowDoc}>
        <span className={s.flowDocName}>factura.pdf</span>
        <div className={s.flowPaper}>
          <b className={v > 0.3 ? s.flowHit : undefined} />
          <span />
          <span />
          <b className={v > 0.3 ? s.flowHit : undefined} />
          <span />
          <span />
          <span />
          <b className={`${s.flowTotal} ${v > 0.3 ? s.flowHit : ""}`} />
          {reading && <i className={s.flowScan} style={{ top: `${scan * 100}%` }} />}
        </div>
      </div>

      <div className={s.flowLink}>
        <i style={{ transform: `scaleX(${span(v, 0.06, 0.16)})` }} />
      </div>

      <div className={s.flowSteps}>
        <div className={`${s.flowNode} ${v > 0.08 ? s.on : ""}`}>
          <span className={s.flowChip}>Amazon Textract</span>
          <b>{v > 0.34 ? "Documento leído" : reading ? "Leyendo el documento…" : "Esperando documento"}</b>
        </div>
        <div className={s.flowDown}>
          <i style={{ transform: `scaleY(${span(v, 0.32, 0.42)})` }} />
        </div>
        <div className={`${s.flowNode} ${v > 0.4 ? s.on : ""}`}>
          <span className={s.flowChip}>Datos extraídos</span>
          <dl className={s.flowFields}>
            {FIELDS.map((f, i) => (
              <div key={f.k} className={i < shownFields ? s.on : undefined}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={s.flowDown}>
          <i style={{ transform: `scaleY(${span(v, 0.62, 0.74)})` }} />
        </div>
        <div className={`${s.flowNode} ${s.flowEnd} ${done ? s.on : ""}`}>
          <span className={s.flowChip}>Tu sistema</span>
          <b>{done ? "Cuenta por pagar creada" : "Sin datos todavía"}</b>
        </div>
      </div>
    </div>
  );
}

/* ───────── Panel administrativo: registras un cliente y todo se actualiza ───────── */
const NEW_NAME = "Marisol Vega";
const NEW_PHONE = "618 123 4567";
const ROWS = [
  { name: "Ferretería Olivo", type: "Mayoreo", due: "$8,200" },
  { name: "Daniel Soto", type: "Menudeo", due: "$0" },
  { name: "Café Quinta", type: "Mayoreo", due: "$15,200" },
];

export function AdminVisual({ p }: { p: MotionValue<number> }) {
  const v = useAdvance(p);
  const name = NEW_NAME.slice(0, Math.round(span(v, 0.08, 0.26) * NEW_NAME.length));
  const phone = NEW_PHONE.slice(0, Math.round(span(v, 0.3, 0.44) * NEW_PHONE.length));
  const typed = v > 0.5;
  const saved = v > 0.62;
  const report = v > 0.82;
  const stage = v < 0.08 ? 0 : v < 0.28 ? 1 : v < 0.46 ? 2 : v < 0.56 ? 3 : 4;
  const cursorAt = ["18%", "30%", "48%", "64%", "84%"][stage];
  const rows = saved ? [{ name: NEW_NAME, type: "Mayoreo", due: "$4,750", fresh: true }, ...ROWS] : ROWS;

  return (
    <div className={`${s.vis} ${s.adm}`} aria-hidden="true">
      <div className={s.admKpis}>
        <div>
          <span>Clientes</span>
          <b>{saved ? 129 : 128}</b>
        </div>
        <div>
          <span>Por cobrar</span>
          <b>{saved ? "$28,150" : "$23,400"}</b>
        </div>
        <div>
          <span>Pedidos hoy</span>
          <b>{saved ? 15 : 14}</b>
        </div>
      </div>

      <div className={s.admBody}>
        <div className={s.admForm}>
          <b className={s.admTitle}>Nuevo cliente</b>
          <div className={`${s.cmsInput} ${stage === 1 ? s.cmsFocus : ""}`}>
            {name || <span className={s.admPh}>Nombre</span>}
            {stage === 1 && <i className={s.caret} />}
          </div>
          <div className={`${s.cmsInput} ${stage === 2 ? s.cmsFocus : ""}`}>
            {phone || <span className={s.admPh}>Teléfono</span>}
            {stage === 2 && <i className={s.caret} />}
          </div>
          <div className={s.admSeg}>
            <span>Menudeo</span>
            <span className={typed ? s.on : undefined}>Mayoreo</span>
          </div>
          <b className={`${s.admSave} ${saved ? s.on : ""}`}>{saved ? "Guardado" : "Guardar"}</b>
          <i className={s.cursor} style={{ top: cursorAt, opacity: saved ? 0 : 1 }} />
        </div>

        <div className={s.admTable}>
          <div className={s.admHead}>
            <span>Cliente</span>
            <span>Tipo</span>
            <span>Saldo</span>
          </div>
          <LayoutGroup>
            {rows.map((r) => (
              <motion.div
                key={r.name}
                layout
                initial={"fresh" in r ? { opacity: 0, y: -10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className={`${s.admRow} ${"fresh" in r ? s.admFresh : ""}`}
              >
                <span>{r.name}</span>
                <span>{r.type}</span>
                <span>{r.due}</span>
              </motion.div>
            ))}
          </LayoutGroup>
        </div>
      </div>

      <div className={`${s.crmToast} ${report ? s.on : ""}`}>
        <i />
        Reporte semanal listo para descargar
      </div>
    </div>
  );
}
