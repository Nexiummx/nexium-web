/** Construye los enlaces wa.me a partir del número (solo dígitos, ej. MX_WA_REDACTED). */

const wa = (number: string, msg: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;

export type WaLinks = {
  hero: string;
  dev: string;
  cons: string;
  saas: string;
  contact: string;
};

export function buildWaLinks(waNumber: string): WaLinks {
  return {
    hero: wa(
      waNumber,
      "Hola Nexium, vi su sitio y quiero saber cómo digitalizar mi negocio"
    ),
    dev: wa(waNumber, "Hola Nexium, me interesa su servicio de desarrollo web"),
    cons: wa(
      waNumber,
      "Hola Nexium, quiero agendar una consultoría de digitalización"
    ),
    saas: wa(
      waNumber,
      "Hola Nexium, quiero saber más sobre las integraciones con IA que realizan"
    ),
    contact: wa(waNumber, "Hola Nexium, quiero hablar de mi proyecto"),
  };
}
