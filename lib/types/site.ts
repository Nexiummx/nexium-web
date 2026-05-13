export type Project = {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  year: string;
  tech: string[];
  url: string;
  imagen: string;
};

export type Service = {
  id: string;
  nombre: string;
  descripcion: string;
  incluye: string[];
  casosUso?: string[];
  precioPlaceholder: string;
};

export type FaqItem = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  nombre: string;
  empresa: string;
  imagen?: string;
};
