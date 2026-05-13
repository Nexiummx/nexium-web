"use client";

import { animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_NEX } from "@/lib/animations";

function CountCell({
  to,
  label,
  prefix,
  suffix,
  decimals,
}: {
  to: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [text, setText] = useState(prefix ? `${prefix}0` : "0");

  useMotionValueEvent(mv, "change", (v) => {
    const n = decimals ? Number(v.toFixed(decimals)) : Math.round(v);
    setText(`${prefix ?? ""}${n}${suffix ?? ""}`);
  });

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setText(
        `${prefix ?? ""}${decimals ? to.toFixed(decimals) : Math.round(to)}${suffix ?? ""}`,
      );
      return;
    }
    const c = animate(mv, to, {
      duration: 1.15,
      ease: EASE_NEX,
    });
    return () => c.stop();
  }, [inView, to, mv, prefix, suffix, decimals, reduce]);

  return (
    <div
      ref={ref}
      className="flex min-w-[200px] shrink-0 flex-col items-center gap-2 border-r border-white/10 px-6 py-8 last:border-r-0 sm:min-w-0 sm:flex-1"
    >
      <span className="font-display text-[clamp(3rem,8vw,4.5rem)] tabular-nums tracking-tight text-nex-warm">
        {text}
      </span>
      <span className="text-center font-mono text-xs uppercase tracking-[0.2em] text-nex-muted">
        {label}
      </span>
    </div>
  );
}

export function StatsRibbon() {
  return (
    <section className="border-y border-white/5 bg-nex-surfaceAlt">
      <div className="mx-auto max-w-[1920px]">
        <div className="flex snap-x snap-mandatory overflow-x-auto sm:snap-none sm:overflow-visible">
          <div className="flex min-w-full snap-center sm:min-w-0 sm:w-full">
            <CountCell to={3} label="Proyectos en vivo" />
            <CountCell to={100} suffix="%" label="Código propio" />
            <div className="flex min-w-[200px] shrink-0 flex-col items-center gap-2 border-r border-white/10 px-6 py-8 last:border-r-0 sm:min-w-0 sm:flex-1">
              <span className="font-display text-[clamp(3rem,8vw,4.5rem)] tabular-nums text-nex-warm">
                &lt;2s
              </span>
              <span className="text-center font-mono text-xs uppercase tracking-[0.2em] text-nex-muted">
                Tiempo de carga
              </span>
            </div>
            <div className="flex min-w-[200px] shrink-0 flex-col items-center gap-2 px-6 py-8 sm:flex-1">
              <span className="font-display text-[clamp(3rem,8vw,4.5rem)] tabular-nums text-nex-warm">
                24/7
              </span>
              <span className="text-center font-mono text-xs uppercase tracking-[0.2em] text-nex-muted">
                Soporte técnico
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
