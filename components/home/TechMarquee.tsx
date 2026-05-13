"use client";

const items = [
  { name: "React", color: "#61DAFB" },
  { name: "Next.js", color: "#ffffff" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Tailwind", color: "#38BDF8" },
  { name: "Vercel", color: "#ffffff" },
  { name: "Node.js", color: "#3C873A" },
  { name: "NestJS", color: "#E0234E" },
  { name: "AWS", color: "#FF9900" },
  { name: "Python", color: "#3776AB" },
  { name: "Shopify", color: "#95BF47" },
  { name: "Stripe", color: "#635BFF" },
  { name: "Framer Motion", color: "#FF0055" },
];

function Row() {
  const doubled = [...items, ...items];
  return (
    <div className="flex w-max animate-marquee-mobile gap-12 pr-12 md:animate-marquee">
      {doubled.map((t, i) => (
        <span
          key={`${t.name}-${i}`}
          className="group whitespace-nowrap font-mono text-sm uppercase tracking-[0.2em] text-nex-warm/90 transition-colors duration-300 group-hover:text-[color:var(--brand)]"
          style={{ ["--brand" as string]: t.color } as React.CSSProperties}
        >
          {t.name}
        </span>
      ))}
    </div>
  );
}

export function TechMarquee() {
  return (
    <section className="border-y border-white/5 bg-nex-bg py-16">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mb-10 font-mono text-xs uppercase tracking-[0.25em] text-nex-blueGlow">
          Stack
        </p>
        <h2 className="font-display text-4xl font-normal md:text-5xl [line-height:0.95]">
          Tecnología <em className="italic text-nex-warm">moderna.</em>
        </h2>
      </div>
      <div className="relative mt-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16 bg-gradient-to-r from-nex-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-16 bg-gradient-to-l from-nex-bg to-transparent" />
        <Row />
      </div>
    </section>
  );
}
