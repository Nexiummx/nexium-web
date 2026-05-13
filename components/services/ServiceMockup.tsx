import type { Service } from "@/lib/types/site";
import { cn } from "@/lib/cn";

const PREVIEW_SLUG: Record<string, string> = {
  web: "sitio-web",
  ecommerce: "tienda",
  auto: "automatizaciones",
  consultoria: "consultoria",
};

type Variant = "page" | "card";

export function ServiceMockup({
  service,
  variant = "page",
  className,
}: {
  service: Service;
  variant?: Variant;
  className?: string;
}) {
  const isCard = variant === "card";

  return (
    <div
      className={cn(
        "overflow-hidden bg-nex-bg",
        isCard
          ? "border-b border-white/10"
          : "rounded-sm border border-white/10 shadow-[0_28px_100px_rgba(0,0,0,0.55)]",
        className,
      )}
      role="img"
      aria-label={`Vista previa UI: ${service.nombre}`}
    >
      <div
        className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5 md:px-4"
        aria-hidden
      >
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
        <span className="ml-2 flex-1 truncate rounded bg-white/[0.06] px-2 py-1 text-center font-mono text-[9px] uppercase tracking-widest text-nex-muted md:text-[10px]">
          {PREVIEW_SLUG[service.id] ?? service.id}.nexium — preview
        </span>
      </div>
      <div
        className={cn(
          "relative flex w-full items-stretch overflow-hidden bg-[#121212]",
          isCard ? "min-h-[160px] aspect-video sm:min-h-[180px]" : "aspect-[4/3] min-h-[220px] md:aspect-[16/10] md:min-h-[280px]",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col transition-transform duration-500 ease-nex group-hover:scale-[1.02]",
            isCard ? "p-3 sm:p-4" : "p-4 sm:p-6 md:p-8",
          )}
        >
          {service.id === "web" ? (
            <MockupWeb compact={isCard} />
          ) : service.id === "ecommerce" ? (
            <MockupEcommerce compact={isCard} />
          ) : service.id === "auto" ? (
            <MockupAutomations compact={isCard} />
          ) : (
            <MockupConsulting compact={isCard} />
          )}
        </div>
      </div>
    </div>
  );
}

function MockupWeb({ compact }: { compact: boolean }) {
  const t = compact ? "text-[9px]" : "text-[10px] sm:text-xs";
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col text-nex-text/90">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className={cn("rounded bg-nex-warm/35", compact ? "h-2 w-14" : "h-2.5 w-20")} />
        <div className="flex flex-1 justify-end gap-1.5 sm:gap-2">
          <span className={cn("rounded bg-white/12", compact ? "h-1.5 w-8" : "h-2 w-10")} />
          <span className={cn("rounded bg-white/12", compact ? "h-1.5 w-10" : "h-2 w-12")} />
          <span className={cn("rounded bg-white/12", compact ? "h-1.5 w-9" : "h-2 w-11")} />
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full bg-nex-blue/90 font-mono uppercase tracking-wider text-nex-text",
            compact ? "px-2 py-0.5 text-[8px]" : "px-3 py-1 text-[9px]",
          )}
        >
          CTA
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-3 sm:pt-4">
        <div className={cn("rounded bg-white/18", compact ? "h-2 w-[88%]" : "h-2.5 w-[85%]")} />
        <div
          className={cn(
            "mt-2 rounded bg-white/12",
            compact ? "h-2 w-[55%]" : "h-2.5 w-[50%]",
          )}
        />
        <p className={cn("mt-2 text-nex-muted", t)}>Subtítulo breve</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-nex-blue px-3 py-1 font-mono text-[9px] uppercase text-nex-text">
            Primario
          </span>
          <span className="rounded-full border border-nex-warm/40 px-3 py-1 font-mono text-[9px] uppercase text-nex-warm">
            Secundario
          </span>
        </div>
        <div
          className={cn(
            "mt-auto grid shrink-0 gap-2 border-t border-white/5 pt-3 sm:pt-4",
            compact ? "grid-cols-3" : "grid-cols-3",
          )}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded border border-white/10 bg-nex-surfaceAlt/80 p-2 sm:p-3"
            >
              <div className="mb-2 aspect-[4/3] w-full rounded bg-white/8" />
              <div className="h-1 w-3/4 rounded bg-white/15" />
              <div className="mt-1 h-1 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupEcommerce({ compact }: { compact: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col text-nex-text/90">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-nex-warm">
          Tienda
        </span>
        <div className="flex items-center gap-2">
          <div className="h-6 w-24 rounded border border-white/10 bg-white/5 sm:w-32" />
          <div className="flex h-8 w-8 items-center justify-center rounded border border-nex-blue/50 bg-nex-blue/20 font-mono text-[10px] text-nex-text">
            2
          </div>
        </div>
      </header>
      <div
        className={cn(
          "mt-3 grid min-h-0 flex-1 gap-2 sm:gap-3",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {(compact ? [1, 2] : [1, 2, 3]).map((i) => (
          <article
            key={i}
            className="flex flex-col rounded border border-white/10 bg-nex-surfaceAlt/60 p-2 sm:p-3"
          >
            <div className="aspect-square w-full rounded bg-gradient-to-br from-nex-warm/15 to-nex-blue/10" />
            <div className="mt-2 h-1.5 w-full rounded bg-white/15" />
            <div className="mt-1 h-1 w-2/3 rounded bg-white/10" />
            <p className="mt-2 font-mono text-[11px] text-nex-warm sm:text-xs">
              $1,290 MXN
            </p>
            <button
              type="button"
              tabIndex={-1}
              className="mt-2 w-full rounded bg-nex-blue py-1.5 font-mono text-[9px] uppercase tracking-wide text-nex-text"
            >
              Agregar
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function MockupAutomations({ compact }: { compact: boolean }) {
  const Step = ({
    label,
    narrow,
  }: {
    label: string;
    narrow?: boolean;
  }) => (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded border border-white/12 bg-nex-surfaceAlt/90 px-2 py-2 text-center font-mono uppercase tracking-wider text-nex-text shadow-sm",
        narrow ? "min-w-0 flex-1 text-[7px] sm:text-[8px]" : "text-[8px] sm:text-[9px]",
        compact ? "py-1.5" : "py-2.5 sm:px-3",
      )}
    >
      {label}
    </div>
  );

  const Arrow = () => (
    <span className="shrink-0 font-mono text-[10px] text-nex-blueGlow sm:text-xs">
      →
    </span>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col justify-center gap-3 text-nex-text/90">
      <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-nex-muted">
        Flujo en vivo
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
        <Step label="Form" narrow />
        <Arrow />
        <Step label="Reglas" narrow />
        <Arrow />
        <Step label="WhatsApp" narrow />
        <Arrow />
        <Step label="CRM" narrow />
      </div>
      <div
        className={cn(
          "mx-auto mt-1 flex max-w-full items-center gap-2 rounded border border-nex-warm/25 bg-nex-warm/5 px-3 py-2",
          compact && "flex-col py-2",
        )}
      >
        <span className="font-mono text-[9px] uppercase text-nex-warm sm:text-[10px]">
          Bot cotización
        </span>
        <div className="h-px flex-1 bg-nex-warm/20 sm:max-w-[120px]" />
        <span className="rounded bg-nex-blue/30 px-2 py-0.5 font-mono text-[8px] text-nex-text">
          IA · respuesta
        </span>
      </div>
    </div>
  );
}

function MockupConsulting({ compact }: { compact: boolean }) {
  const phases = [
    { k: "01", t: "Diagnóstico" },
    { k: "02", t: "Prioridad" },
    { k: "03", t: "Roadmap" },
    { k: "04", t: "Build" },
  ];
  const show = compact ? phases.slice(0, 3) : phases;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col justify-center text-nex-text/90">
      <div className="flex w-full items-center">
        {show.map((p, i) => (
          <div key={p.k} className="contents">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-nex-warm/50 bg-nex-bg font-mono text-[9px] text-nex-warm sm:h-7 sm:w-7 sm:text-[10px]">
                {p.k}
              </div>
              <p className="mt-2 max-w-[4.5rem] text-center font-mono text-[8px] uppercase leading-tight tracking-wide text-nex-secondary sm:max-w-none sm:text-[9px]">
                {p.t}
              </p>
            </div>
            {i < show.length - 1 ? (
              <div
                className="mx-0.5 h-px min-w-[8px] flex-1 bg-nex-blue/45 sm:mx-1"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:grid-cols-3">
        <div className="rounded border border-dashed border-white/15 p-2">
          <div className="h-1 w-full rounded bg-white/10" />
          <div className="mt-1 h-1 w-[80%] rounded bg-white/8" />
          <p className="mt-2 font-mono text-[8px] uppercase text-nex-muted">
            Impacto
          </p>
        </div>
        <div className="rounded border border-dashed border-white/15 p-2">
          <div className="h-1 w-full rounded bg-white/10" />
          <div className="mt-1 h-1 w-[60%] rounded bg-white/8" />
          <p className="mt-2 font-mono text-[8px] uppercase text-nex-muted">
            Esfuerzo
          </p>
        </div>
        {!compact ? (
          <div className="hidden rounded border border-nex-blue/30 bg-nex-blue/10 p-2 sm:block">
            <p className="font-mono text-[8px] uppercase leading-relaxed text-nex-blueGlow">
              Stack sugerido
            </p>
            <div className="mt-2 space-y-1">
              <div className="h-0.5 w-full rounded bg-white/15" />
              <div className="h-0.5 w-[80%] rounded bg-white/10" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
