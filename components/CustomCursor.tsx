"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { CURSOR_SPRING } from "@/lib/animations";

type CursorMode = "default" | "link" | "image";

export function CustomCursor() {
  const [mode, setMode] = useState<CursorMode>("default");
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springX = useSpring(mouseX, CURSOR_SPRING);
  const springY = useSpring(mouseY, CURSOR_SPRING);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest("[data-cursor-image]")) setMode("image");
      else if (el.closest("a, button, [role='button'], [data-cursor-link]"))
        setMode("link");
      else setMode("default");
    };
    const leave = () => {
      mouseX.set(-100);
      mouseY.set(-100);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [mouseX, mouseY]);

  const w =
    mode === "image" ? 80 : mode === "link" ? 30 : 12;

  return (
    <motion.div
      className="pointer-events-none fixed z-[9998] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-nex-warm bg-white text-nex-onLight"
      style={{
        left: springX,
        top: springY,
      }}
      animate={{ width: w, height: w }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {mode === "image" ? (
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em]">
          VER →
        </span>
      ) : null}
    </motion.div>
  );
}
