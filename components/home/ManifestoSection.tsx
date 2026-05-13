"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

const body =
  "Creemos que la tecnología debe ser invisible. Que las herramientas más poderosas son las que nunca tienes que pensar. Construimos sitios, sistemas y automatizaciones para emprendedores que valoran su tiempo más que cualquier otra cosa.";

export function ManifestoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 40%"],
  });
  const words = body.split(" ");

  return (
    <section className="bg-nex-bg px-5 py-24 md:px-8 md:py-32 lg:px-16 xl:px-24">
      <div
        ref={ref}
        className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-16"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
            Manifiesto
          </p>
          <motion.div
            className="mt-6 h-px w-10 bg-nex-blue"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "0 50%" }}
          />
        </div>
        <p className="font-display text-2xl font-normal leading-relaxed text-nex-text md:text-3xl">
          {words.map((word, i) => (
            <ManifestoWord
              key={`${word}-${i}`}
              word={word}
              index={i}
              total={words.length}
              prev={words[i - 1]}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </p>
      </div>
    </section>
  );
}

function ManifestoWord({
  word,
  index,
  total,
  prev,
  scrollYProgress,
}: {
  word: string;
  index: number;
  total: number;
  prev: string | undefined;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / (total + 3);
  const end = Math.min(1, start + 0.14);
  const opacity = useTransform(scrollYProgress, [start, end], [0.14, 1]);
  const italic =
    word === "invisible." || (word === "tiempo" && prev === "su");

  return (
    <motion.span
      style={{ opacity }}
      className={italic ? "italic text-nex-warm" : undefined}
    >
      {word}{" "}
    </motion.span>
  );
}
