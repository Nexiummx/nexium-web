"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EMAIL, IG_URL } from "@/lib/constants";
import { CALENDLY_URL } from "@/lib/site-constants";
import { useSiteWa } from "@/components/SiteConfigProvider";
import faq from "@/src/data/faq.json";
import type { FaqItem } from "@/lib/types/site";
import { EASE_NEX } from "@/lib/animations";

const faqList = faq as FaqItem[];

const budgetOptions = [
  "Por definir",
  "Rango inicial",
  "Rango medio",
  "Rango alto",
  "Empresa / varias fases",
];

const projectTypes = [
  "Sitio web",
  "Ecommerce",
  "Automatización",
  "Consultoría",
  "Otro",
];

export function ContactoView() {
  const { waNumber, waLinks } = useSiteWa();
  const [openId, setOpenId] = useState<string | null>(faqList[0]?.id ?? null);

  const waDisplay = waNumber.length >= 10
    ? `+${waNumber}`
    : "+52 618 000 0000 (placeholder)";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const subject = encodeURIComponent(
      `[Nexium] ${String(fd.get("tipo") ?? "Contacto")}`,
    );
    const body = encodeURIComponent(
      [
        `Nombre: ${fd.get("nombre")}`,
        `Empresa: ${fd.get("empresa") || "—"}`,
        `Email: ${fd.get("email")}`,
        `Tel / WhatsApp: ${fd.get("telefono")}`,
        `Tipo: ${fd.get("tipo")}`,
        `Presupuesto: ${fd.get("presupuesto")}`,
        "",
        String(fd.get("mensaje") ?? ""),
      ].join("\n"),
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <section className="flex min-h-[40vh] flex-col justify-end px-5 pb-12 pt-32 md:px-8 lg:px-16 xl:px-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Hablemos
        </p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-normal leading-[0.95] md:text-6xl lg:text-7xl">
          Cuéntanos <em className="italic text-nex-warm">tu proyecto.</em>
        </h1>
        <p className="mt-6 font-sans text-lg font-light text-nex-secondary">
          Respondemos en menos de 24 horas.
        </p>
      </section>

      <div className="mx-auto grid max-w-6xl gap-16 px-5 pb-24 md:px-8 lg:grid-cols-5 lg:px-16 xl:px-24">
        <div className="lg:col-span-3">
          <form onSubmit={onSubmit} className="space-y-10">
            <Field id="nombre" name="nombre" label="Nombre" required />
            <Field id="empresa" name="empresa" label="Empresa (opcional)" />
            <Field
              id="email"
              name="email"
              label="Email"
              type="email"
              required
            />
            <Field
              id="telefono"
              name="telefono"
              label="Teléfono / WhatsApp"
              required
            />

            <div className="relative pt-2">
              <label
                htmlFor="tipo"
                className="mb-2 block font-mono text-sm uppercase tracking-widest text-nex-muted"
              >
                Tipo de proyecto
              </label>
              <select
                id="tipo"
                name="tipo"
                required
                className="w-full appearance-none border-b border-nex-warm/30 bg-transparent py-3 font-sans text-nex-text outline-none transition-colors focus:border-nex-blue min-h-[48px]"
              >
                {projectTypes.map((t) => (
                  <option key={t} value={t} className="bg-nex-bg">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative pt-2">
              <label
                htmlFor="presupuesto"
                className="mb-2 block font-mono text-sm uppercase tracking-widest text-nex-muted"
              >
                Presupuesto estimado
              </label>
              <select
                id="presupuesto"
                name="presupuesto"
                className="w-full appearance-none border-b border-nex-warm/30 bg-transparent py-3 font-sans text-nex-text outline-none transition-colors focus:border-nex-blue min-h-[48px]"
              >
                {budgetOptions.map((t) => (
                  <option key={t} value={t} className="bg-nex-bg">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative pt-4">
              <textarea
                id="mensaje"
                name="mensaje"
                rows={5}
                required
                placeholder=" "
                className="peer w-full resize-y border-b border-nex-warm/30 bg-transparent py-3 font-sans text-nex-text outline-none transition-colors focus:border-nex-blue"
              />
              <label
                htmlFor="mensaje"
                className="pointer-events-none absolute left-0 top-4 origin-left font-mono text-sm uppercase tracking-widest text-nex-muted transition-all duration-200 peer-focus:-translate-y-6 peer-focus:text-xs peer-focus:text-nex-blue peer-placeholder-shown:translate-y-0 peer-[&:not(:placeholder-shown)]:-translate-y-6 peer-[&:not(:placeholder-shown)]:text-xs"
              >
                Cuéntanos sobre tu proyecto
              </label>
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] rounded-full bg-nex-blue py-4 font-mono text-xs font-medium uppercase tracking-widest text-nex-text transition-transform hover:scale-[1.01]"
              data-cursor-link
            >
              Enviar mensaje →
            </button>
            <p className="font-mono text-[10px] text-nex-muted">
              Se abrirá tu cliente de correo con el mensaje. También puedes
              escribirnos directamente a {EMAIL}.
            </p>
          </form>
        </div>

        <aside className="lg:col-span-2">
          <div className="border border-white/10 bg-nex-surfaceAlt p-8">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
              Contacto directo
            </p>
            <dl className="mt-8 space-y-5 font-mono text-sm">
              <div>
                <dt className="text-nex-muted">Email</dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${EMAIL}`}
                    className="text-nex-text hover:text-nex-blueGlow"
                    data-cursor-link
                  >
                    {EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-nex-muted">WhatsApp</dt>
                <dd className="mt-1">
                  {waLinks ? (
                    <a
                      href={waLinks.contact}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nex-text hover:text-nex-blueGlow"
                      data-cursor-link
                    >
                      {waDisplay}
                    </a>
                  ) : (
                    <span className="text-nex-secondary">{waDisplay}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-nex-muted">Instagram</dt>
                <dd className="mt-1">
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-nex-text hover:text-nex-blueGlow"
                    data-cursor-link
                  >
                    @nexiummx
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-nex-muted">Ubicación</dt>
                <dd className="mt-1 text-nex-secondary">Durango, México</dd>
              </div>
              <div>
                <dt className="text-nex-muted">Horario</dt>
                <dd className="mt-1 text-nex-secondary">
                  Lun – Vie, 9am – 7pm CST
                </dd>
              </div>
            </dl>

            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="font-mono text-xs uppercase tracking-widest text-nex-muted">
                Agendar directamente
              </p>
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex min-h-[48px] items-center justify-center rounded-full border border-nex-blue px-6 py-3 font-mono text-xs uppercase tracking-widest text-nex-text transition-colors hover:bg-nex-blue"
                data-cursor-link
              >
                Abrir calendario
              </a>
              <p className="mt-3 font-mono text-[10px] text-nex-muted">
                30 minutos. Sin compromiso. URL placeholder: configurar Calendly
                real en código (`lib/site-constants.ts`).
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="border-t border-white/5 bg-nex-surfaceAlt px-5 py-20 md:px-8 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl text-nex-text md:text-4xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-10 divide-y divide-white/10">
            {faqList.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id} className="py-2">
                  <button
                    type="button"
                    className="flex w-full min-h-[48px] items-center justify-between gap-4 py-3 text-left font-sans text-base text-nex-text"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                  >
                    {item.pregunta}
                    <span className="font-mono text-nex-muted">
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE_NEX }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 font-sans text-sm font-light leading-relaxed text-nex-secondary">
                          {item.respuesta}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="relative pt-6">
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder=" "
        autoComplete={
          type === "email" ? "email" : type === "tel" ? "tel" : "name"
        }
        className="peer w-full border-b border-nex-warm/30 bg-transparent py-3 font-sans text-nex-text outline-none transition-colors focus:border-nex-blue min-h-[48px]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-7 origin-left font-mono text-sm uppercase tracking-widest text-nex-muted transition-all duration-200 peer-focus:-translate-y-6 peer-focus:text-xs peer-focus:text-nex-blue peer-placeholder-shown:translate-y-0 peer-[&:not(:placeholder-shown)]:-translate-y-6 peer-[&:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}
