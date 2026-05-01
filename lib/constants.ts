// Single source of truth para todos los links y datos de contacto.
// Cambiar el número de WhatsApp aquí lo actualiza en todo el sitio.

export const WA_NUMBER = "526183109801"; // formato: 52 + lada + número, sin +

const wa = (msg: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

export const WA_LINKS = {
  hero: wa("Hola Nexium, vi su sitio y quiero saber cómo digitalizar mi negocio"),
  dev: wa("Hola Nexium, me interesa su servicio de desarrollo web"),
  cons: wa("Hola Nexium, quiero agendar una consultoría de digitalización"),
  saas: wa("Hola Nexium, quiero saber más del SaaS para agencias automotrices"),
  contact: wa("Hola Nexium, quiero hablar de mi proyecto"),
} as const;

export const EMAIL = "info@nexiummx.com";
export const SITE_URL = "https://www.nexiummx.com";
export const IG_URL = "https://www.instagram.com/nexiummx?igsh=MThwMGFnbnNzOGtpZw=="; // actualizar con handle real
export const FB_URL = "https://www.facebook.com/share/18ckS66URV/"; // actualizar con handle real
