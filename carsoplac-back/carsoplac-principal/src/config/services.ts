// src/config/services.ts
// ──────────────────────────────────────────────────────────────
// FUENTE ÚNICA de datos de la sección Servicios.
//
// Para sumar un servicio nuevo: agregar un objeto al array SERVICES.
// La página (/servicios) se arma sola a partir de este array —
// no hace falta tocar ningún componente.
//
// Campos:
//   - id:             identificador estable (no repetir).
//   - name:           nombre visible del servicio.
//   - description:    descripción corta, orientada al cliente.
//   - Icon:           ícono de lucide-react (se usa si no hay imageUrl).
//   - imageUrl:       opcional. Si se define, gana sobre el ícono.
//   - active:         false => el servicio no aparece en ningún lado.
//   - status:         "disponible" | "proximamente".
//                     "proximamente" => se ve, pero no se puede contratar.
//   - order:          orden de aparición (menor a mayor).
//   - ctaLabel:       texto del botón principal de la card.
//   - whatsappMessage: mensaje precargado (el nombre del servicio incluido).
//
// Relación con la tienda:
//   - relatedCategories: nombres EXACTOS de las categorías de la base
//     (comparación tolerante: ignora mayúsculas y acentos). Si está
//     vacío o no está, el servicio no aparece en fichas de producto
//     ni muestra "Ver materiales".
//   - materialsLink: opcional. Link explícito a la categoría; si falta,
//     se deriva del primer relatedCategories como
//     /productos?cat=<nombre con encodeURIComponent>.
//
// Contenido ampliado (opcional, se muestra en un acordeón):
//   - includes / excludes / zones / estimatedTime.
//   - comingSoonMessage: mensaje de WhatsApp para servicios "proximamente".
// ──────────────────────────────────────────────────────────────
import type { LucideIcon } from "lucide-react";
import { Layers, Paintbrush, Hammer, Wrench } from "lucide-react";
import { getWhatsAppUrl } from "./whatsapp";

export type ServiceStatus = "disponible" | "proximamente";

export type Service = {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  imageUrl?: string;
  active: boolean;
  status: ServiceStatus;
  order: number;
  ctaLabel: string;
  whatsappMessage: string;
  /** Categorías de la tienda asociadas (nombres exactos de la base). */
  relatedCategories?: string[];
  /** Link explícito a la categoría; si falta, se deriva de relatedCategories. */
  materialsLink?: string;
  /** Qué incluye el servicio. */
  includes?: string[];
  /** Qué NO incluye el servicio. */
  excludes?: string[];
  /** Zonas donde trabajan. */
  zones?: string[];
  /** Tiempo estimado del trabajo. */
  estimatedTime?: string;
  /** Mensaje de WhatsApp para consultar por un servicio "proximamente". */
  comingSoonMessage?: string;
};

export const SERVICES: Service[] = [
  {
    id: "colocacion-placas",
    name: "Colocación de placas",
    description:
      "Instalamos placas de yeso, PVC y cemento en paredes y cielorrasos. Trabajo prolijo, nivel perfecto y superficie lista para pintar o empapelar.",
    Icon: Layers,
    active: true,
    status: "disponible",
    order: 1,
    ctaLabel: "Solicitar presupuesto",
    whatsappMessage:
      "¡Hola! Quiero pedir presupuesto para el servicio de *Colocación de placas*. ¿Me pasan más info?",
    // TODO: confirmar con el dueño los nombres exactos de las categorías en la base
    relatedCategories: ["Placas", "Revestimientos"],
    // TODO: confirmar con el dueño
    includes: [
      "Colocación de placas de yeso, PVC o cemento",
      "Nivelación y fijación sobre estructura",
      "Masillado de uniones, listo para pintar",
    ],
    // TODO: confirmar con el dueño
    excludes: [
      "Los materiales de colocación (se pueden comprar en la tienda)",
      "Pintura final o empapelado",
    ],
    // TODO: reemplazar por las zonas reales cuando el dueño las pase
    zones: ["Consultá por tu zona"],
    // TODO: confirmar con el dueño
    estimatedTime: "1 a 3 días según la superficie",
  },
  {
    id: "pintores",
    name: "Pintores",
    description:
      "Pintura interior y exterior a cargo de pintores con experiencia. Preparamos la superficie, protegemos tus muebles y entregamos el espacio limpio.",
    Icon: Paintbrush,
    active: true,
    status: "disponible",
    order: 2,
    ctaLabel: "Solicitar presupuesto",
    whatsappMessage:
      "¡Hola! Quiero pedir presupuesto para el servicio de *Pintores*. ¿Me pasan más info?",
    // Sin categorías asociadas por ahora: no aparece en fichas de producto
    // ni muestra "Ver materiales". Sumar nombres acá cuando se definan.
    relatedCategories: [],
    // TODO: confirmar con el dueño
    includes: [
      "Preparación de la superficie (resanado y lijado)",
      "Pintura interior y exterior",
      "Protección de pisos y mobiliario",
    ],
    // TODO: confirmar con el dueño
    excludes: [
      "La pintura (se puede comprar en la tienda)",
      "Reparaciones estructurales grandes",
    ],
    // TODO: reemplazar por las zonas reales cuando el dueño las pase
    zones: ["Consultá por tu zona"],
    // TODO: confirmar con el dueño
    estimatedTime: "1 a 4 días según la superficie",
  },
  {
    id: "colocaciones-varias",
    name: "Colocaciones varias",
    description:
      "Instalamos mesadas, revestimientos, muebles y accesorios. Si compraste en la tienda, coordinamos la colocación con nuestro propio equipo.",
    Icon: Hammer,
    active: true,
    status: "disponible",
    order: 3,
    ctaLabel: "Solicitar presupuesto",
    whatsappMessage:
      "¡Hola! Quiero pedir presupuesto para el servicio de *Colocaciones varias*. ¿Me pasan más info?",
    // TODO: confirmar con el dueño los nombres exactos de las categorías en la base
    relatedCategories: ["Mesadas", "Muebles"],
    // TODO: confirmar con el dueño
    includes: [
      "Colocación de mesadas y bachas",
      "Instalación de muebles y accesorios",
      "Fijaciones, nivelación y ajustes finales",
    ],
    // TODO: confirmar con el dueño
    excludes: [
      "La mesada o el mueble (se compran en la tienda)",
      "Obra gruesa o modificaciones de plomería",
    ],
    // TODO: reemplazar por las zonas reales cuando el dueño las pase
    zones: ["Consultá por tu zona"],
    // TODO: confirmar con el dueño
    estimatedTime: "De medio día a 2 días según el trabajo",
  },
  {
    id: "mantenimiento-reparaciones",
    name: "Mantenimiento y reparaciones",
    description:
      "Reparaciones y mantenimiento general para tu hogar. Muy pronto vas a poder contratarlo directamente desde la tienda.",
    Icon: Wrench,
    active: true,
    status: "proximamente",
    order: 4,
    ctaLabel: "Próximamente",
    whatsappMessage: "",
    // TODO: ajustar el texto con el dueño si hace falta
    comingSoonMessage:
      "¡Hola! Me interesa el servicio de *Mantenimiento y reparaciones*, que está próximamente. ¿Me avisan cuando esté disponible?",
  },
];

/** Servicios visibles en la página: solo activos, ordenados por `order`. */
export function getActiveServices(): Service[] {
  return SERVICES.filter((s) => s.active).sort((a, b) => a.order - b.order);
}

/** URL de WhatsApp con el mensaje precargado del servicio. */
export function getServiceWhatsAppUrl(service: Service): string {
  return getWhatsAppUrl(service.whatsappMessage);
}

/**
 * Normaliza un nombre para compararlo: minúsculas, sin acentos y
 * espacios o símbolos → guiones. Ej.: "Placas de Yeso" == "placas-de-yeso".
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Servicios activos y disponibles que cubren la categoría del producto.
 * La comparación es por nombre normalizado contra relatedCategories.
 * Si no hay match (o no hay categoría), devuelve [] => la ficha de
 * producto no muestra el bloque de servicios.
 */
export function getServicesForCategory(
  categoryName?: string | null,
): Service[] {
  if (!categoryName) return [];
  const categorySlug = slugify(categoryName);
  if (!categorySlug) return [];
  return getActiveServices().filter(
    (s) =>
      s.status === "disponible" &&
      (s.relatedCategories ?? []).some((c) => slugify(c) === categorySlug),
  );
}

/**
 * Link "Ver materiales" hacia la categoría de la tienda. Usa el nombre
 * EXACTO de la base con encodeURIComponent (el backend filtra por
 * igualdad). Devuelve null si el servicio no tiene categoría asociada.
 */
export function getServiceMaterialsLink(service: Service): string | null {
  if (service.materialsLink) return service.materialsLink;
  const category = service.relatedCategories?.find((c) => c.trim() !== "");
  return category ? `/productos?cat=${encodeURIComponent(category)}` : null;
}

/** WhatsApp para consultar por un servicio que está "proximamente". */
export function getServiceComingSoonUrl(service: Service): string {
  const message =
    service.comingSoonMessage ||
    `¡Hola! Me interesa el servicio de *${service.name}*, que está próximamente. ¿Me avisan cuando esté disponible?`;
  return getWhatsAppUrl(message);
}
