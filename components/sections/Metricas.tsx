"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Metricas.module.css";

interface Metric {
  value: number;
  suffix: string;
  label: string;
}

const METRICS: Metric[] = [
  { value: 100, suffix: "%", label: "Transparencia desde la primera llamada" },
  { value: 24, suffix: "h", label: "Tiempo máximo de respuesta" },
  { value: 32, suffix: " estados", label: "Cobertura nacional, base en Durango" },
];

function Counter({
  end,
  suffix,
  duration = 1800,
}: {
  end: number;
  suffix: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 4);
            setValue(Math.round(end * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

export function Metricas() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.item}>
          <div className={styles.value}>
            <Counter end={METRICS[0].value} suffix={METRICS[0].suffix} />
          </div>
          <div className={styles.label}>{METRICS[0].label}</div>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.item}>
          <div className={styles.value}>
            <Counter end={METRICS[1].value} suffix={METRICS[1].suffix} />
          </div>
          <div className={styles.label}>{METRICS[1].label}</div>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.item}>
          <div className={styles.value}>
            <Counter end={METRICS[2].value} suffix={METRICS[2].suffix} />
          </div>
          <div className={styles.label}>{METRICS[2].label}</div>
        </div>
      </div>
    </section>
  );
}
