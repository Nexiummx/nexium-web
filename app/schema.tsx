import { SITE_URL, EMAIL, WA_NUMBER } from "@/lib/constants";

// Schema.org LocalBusiness para Nexium.
// Esto ayuda a Google a entender qué es el negocio, dónde está y cómo contactarlo.
export function SiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Nexium",
    description:
      "Agencia tech que ayuda a emprendedores y startups mexicanos a digitalizar y escalar su negocio.",
    url: SITE_URL,
    telephone: `+${WA_NUMBER}`,
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
      "Software SaaS",
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
