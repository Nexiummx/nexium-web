import { SITE_URL, EMAIL } from "@/lib/constants";
import { getWaNumberFromEnv } from "@/lib/wa-server";

// Schema.org LocalBusiness para Nexium.
// Esto ayuda a Google a entender qué es el negocio, dónde está y cómo contactarlo.
export function SiteSchema() {
  const waNumber = getWaNumberFromEnv();
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Nexium",
    description:
      "Agencia tech que ayuda a emprendedores y startups mexicanos a digitalizar y escalar su negocio.",
    url: SITE_URL,
    telephone: `+${waNumber}`,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Durango",
      addressRegion: "Durango",
      addressCountry: "MX",
    },
    areaServed: {
      "@type": "Country",
      name: "México",
    },
    serviceType: [
      "Desarrollo web",
      "Consultoría de digitalización",
      "Integraciones con IA",
    ],
    priceRange: "$$",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
