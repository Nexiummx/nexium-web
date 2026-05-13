import type { Metadata } from "next";
import { ProyectosView } from "@/components/pages/ProyectosView";

export const metadata: Metadata = {
  title: "Proyectos",
  description:
    "Sitios en producción: Atrio Casa, Clínica Vivanta, Lina & Roma. Cada uno con stack y estética a medida.",
};

export default function ProyectosPage() {
  return (
    <main id="main" className="min-h-screen bg-nex-bg">
      <ProyectosView />
    </main>
  );
}
