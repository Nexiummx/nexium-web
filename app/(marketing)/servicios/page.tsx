import type { Metadata } from "next";
import { ServiciosView } from "@/components/pages/ServiciosView";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Desarrollo web, ecommerce, automatizaciones con IA y consultoría digital. Alcance claro y entregables medibles.",
};

export default function ServiciosPage() {
  return (
    <main id="main" className="min-h-screen bg-nex-bg">
      <ServiciosView />
    </main>
  );
}
