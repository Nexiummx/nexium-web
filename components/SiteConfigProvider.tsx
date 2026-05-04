"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { WaLinks } from "@/lib/wa-links";

export type SiteWaConfig = {
  waNumber: string;
  waLinks: WaLinks;
};

const SiteConfigContext = createContext<SiteWaConfig | null>(null);

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteWaConfig;
  children: ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteWa(): SiteWaConfig {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error("useSiteWa debe usarse dentro de SiteConfigProvider");
  }
  return ctx;
}
