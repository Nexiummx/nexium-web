"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { CustomCursor } from "./CustomCursor";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (desktop && !reduce) {
      document.body.classList.add("nex-cursor-hide");
      return () => document.body.classList.remove("nex-cursor-hide");
    }
  }, [desktop, reduce]);

  return (
    <>
      {children}
      {desktop && !reduce ? <CustomCursor /> : null}
    </>
  );
}
