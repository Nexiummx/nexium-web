import type { Metadata } from "next";
import { ContactoView } from "@/components/pages/ContactoView";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Cuéntanos tu proyecto. Email, WhatsApp y agenda de 30 minutos. Respondemos en menos de 24 horas hábiles.",
};

export default function ContactoPage() {
  return (
    <main id="main" className="min-h-screen bg-nex-bg">
      <ContactoView />
    </main>
  );
}
