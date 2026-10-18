// src/pages/servicios.tsx
// ──────────────────────────────────────────────────────────────
// Página de Servicios — se arma sola desde src/config/services.ts.
// - Servicios con active: false no se renderizan.
// - Servicios con status "proximamente" se ven pero no se contratan.
// ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import {
  Check,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  X,
} from "lucide-react";
import fotoFabrica from "../assets/imagenes/foto-fabrica.jpeg";
import {
  getActiveServices,
  getServiceComingSoonUrl,
  getServiceMaterialsLink,
  getServiceWhatsAppUrl,
  type Service,
} from "../config/services";
import { getWhatsAppUrl } from "../config/whatsapp";
import { trackEvent } from "../lib/analytics";

// Anillo de foco accesible (mismo patrón que Navbar).
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand";

/** Badge de estado del servicio. */
function ServiceBadge({ status }: { status: Service["status"] }) {
  if (status === "disponible") {
    return <span className="chip chip-new">Disponible</span>;
  }
  return (
    <span className="chip border border-spruce-border">Próximamente</span>
  );
}

/** Detalle expandible del servicio (acordeón details/summary nativo: accesible y sin JS). */
function ServiceDetails({ service }: { service: Service }) {
  const includes = service.includes?.length ? service.includes : undefined;
  const excludes = service.excludes?.length ? service.excludes : undefined;
  const zones = service.zones?.length ? service.zones : undefined;

  // Si no hay ningún campo definido, no se renderiza nada (sin huecos vacíos).
  if (!includes && !excludes && !zones && !service.estimatedTime) return null;

  return (
    <details className="group mt-4 rounded-xl border border-spruce-border bg-deep-lichen">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:text-accent-brand [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        Ver más detalles
        <ChevronDown
          size={16}
          aria-hidden
          className="shrink-0 text-sage-gray transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 px-4 pb-4 pt-1 text-sm leading-relaxed text-sage-gray">
        {service.estimatedTime && (
          <p className="flex items-start gap-2">
            <Clock size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-brand" />
            <span>
              <strong className="font-semibold text-white">Tiempo estimado:</strong>{" "}
              {service.estimatedTime}
            </span>
          </p>
        )}
        {zones && (
          <p className="flex items-start gap-2">
            <MapPin size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-brand" />
            <span>
              <strong className="font-semibold text-white">Zonas:</strong> {zones.join(" · ")}
            </span>
          </p>
        )}
        {includes && (
          <div>
            <p className="font-semibold text-white">Qué incluye</p>
            <ul className="mt-1 space-y-1">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {excludes && (
          <div>
            <p className="font-semibold text-white">Qué no incluye</p>
            <ul className="mt-1 space-y-1">
              {excludes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X size={15} aria-hidden className="mt-0.5 shrink-0 text-sage-gray" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

/** Card de un servicio. El CTA depende del estado. */
function ServiceCard({
  service,
  highlighted,
}: {
  service: Service;
  highlighted: boolean;
}) {
  const available = service.status === "disponible";
  const materialsLink = getServiceMaterialsLink(service);
  // Resalte al llegar con un ancla (ej. /servicios#colocacion-placas).
  // Sin transición: con prefers-reduced-motion el cambio es instantáneo.
  const highlightRing = highlighted
    ? "ring-2 ring-accent-brand ring-offset-2 ring-offset-midnight-forest"
    : "";

  return (
    <article
      id={service.id}
      className={`card card-hover flex h-full scroll-mt-28 flex-col p-6 ${highlightRing}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-shaded-fern"
          aria-hidden
        >
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt=""
              className="h-6 w-6 object-contain"
              loading="lazy"
            />
          ) : (
            <service.Icon size={22} className="text-accent-brand" />
          )}
        </span>
        <ServiceBadge status={service.status} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-sage-gray">
        {service.description}
      </p>

      <ServiceDetails service={service} />

      <div className="mt-6 flex flex-col gap-2.5">
        {available ? (
          <>
            <a
              href={getServiceWhatsAppUrl(service)}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-primary w-full ${focusRing}`}
              onClick={() =>
                trackEvent("service_quote_click", {
                  service_id: service.id,
                  service_name: service.name,
                  source: "services_page",
                })
              }
            >
              <MessageCircle size={18} />
              {service.ctaLabel}
            </a>
            {materialsLink && (
              <Link
                to={materialsLink}
                className={`flex items-center justify-center gap-1.5 rounded-full py-1 text-center text-xs font-semibold text-sage-gray underline-offset-4 transition hover:text-white hover:underline ${focusRing}`}
                onClick={() =>
                  trackEvent("service_materials_click", {
                    service_id: service.id,
                    service_name: service.name,
                  })
                }
              >
                <Package size={14} aria-hidden />
                Ver materiales de este servicio
              </Link>
            )}
            <Link
              to="/contacto"
              className={`rounded-full text-center text-xs font-semibold text-sage-gray underline-offset-4 transition hover:text-white hover:underline ${focusRing}`}
            >
              o consultá por el formulario
            </Link>
          </>
        ) : (
          <>
            {/* Texto siempre visible en pantalla (no depende de hover ni de title). */}
            <p className="text-center text-sm leading-relaxed text-sage-gray">
              Estamos preparando este servicio. Si lo necesitás, consultanos.
            </p>
            <a
              href={getServiceComingSoonUrl(service)}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-secondary w-full ${focusRing}`}
              onClick={() =>
                trackEvent("service_coming_soon_click", {
                  service_id: service.id,
                  service_name: service.name,
                })
              }
            >
              <MessageCircle size={18} />
              Consultanos si lo necesitás
            </a>
          </>
        )}
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const services = getActiveServices();
  const location = useLocation();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<number | null>(null);

  // Scroll al ancla (ej. /servicios#colocacion-placas viniendo de la ficha
  // de producto). Como la página carga lazy, esperamos dos frames antes de
  // scrollear: garantiza que el render ya esté en el DOM. Con
  // prefers-reduced-motion el scroll es instantáneo (sin "smooth").
  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        setHighlightId(id);
        if (highlightTimer.current) {
          window.clearTimeout(highlightTimer.current);
        }
        highlightTimer.current = window.setTimeout(
          () => setHighlightId(null),
          2500,
        );
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [location.hash]);

  // Limpieza del timer de resalte al desmontar.
  useEffect(
    () => () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    },
    [],
  );

  // JSON-LD para buscadores (mismo patrón que el JSON-LD de producto).
  const servicesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Servicios Carsoplac",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        provider: { "@type": "Organization", name: "Carsoplac" },
        url: `${window.location.origin}/servicios#${s.id}`,
        // Solo si el servicio define zonas.
        ...(s.zones?.length ? { areaServed: s.zones } : {}),
      },
    })),
  };

  return (
    <div className="bg-midnight-forest text-white">
      <Seo
        title="Servicios"
        description="Colocación de placas, pintores y colocaciones varias con equipo propio de fábrica. Pedí tu presupuesto por WhatsApp, sin compromiso."
        url="/servicios"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />

      {/* ─────────────── HERO ─────────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${fotoFabrica})` }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-midnight-forest/85 via-midnight-forest/70 to-midnight-forest/90" />

        <div className="container-x py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <span className="eyebrow text-accent-brand">Servicios</span>
            <h1 className="display mt-4 text-white">
              Comprás en la tienda,
              <br className="hidden sm:block" />
              <span className="text-accent-brand"> lo instalamos nosotros.</span>
            </h1>
            <p className="mt-6 copy max-w-2xl">
              Colocación de placas, pintura y colocaciones varias con el mismo
              equipo de fábrica que hace tus mesadas y muebles. Pedí presupuesto
              por WhatsApp y coordinamos la visita.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#servicios-lista" className={`btn btn-primary ${focusRing}`}>
                Ver servicios
              </a>
              <Link to="/contacto" className={`btn btn-secondary ${focusRing}`}>
                Consultar por formulario
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── LISTA DE SERVICIOS ─────────────── */}
      <section id="servicios-lista" className="container-x py-12 md:py-20">
        <span className="eyebrow">Qué hacemos</span>
        <h2 className="h2 mt-3">Servicios de colocación y terminaciones</h2>
        <p className="mt-3 max-w-2xl copy">
          Elegí el servicio que necesitás y consultá directo por WhatsApp: el
          mensaje ya te lo dejamos escrito.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              highlighted={highlightId === s.id}
            />
          ))}
        </div>
      </section>

      {/* ─────────────── CTA FINAL ─────────────── */}
      <section className="container-x pb-16 md:pb-24">
        <div className="rounded-2xl border border-spruce-border bg-deep-lichen p-8 text-center md:p-12">
          <span className="eyebrow text-accent-brand">¿Otra consulta?</span>
          <h2 className="h2 mt-3">Contanos qué necesitás</h2>
          <p className="mx-auto mt-3 max-w-xl copy">
            Si tu trabajo no entra en ninguno de estos servicios, escribinos
            igual: lo evaluamos y te cotizamos sin compromiso.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-primary ${focusRing}`}
            >
              <MessageCircle size={18} />
              Hablar por WhatsApp
            </a>
            <Link to="/contacto" className={`btn btn-secondary ${focusRing}`}>
              <Mail size={18} />
              Ir a contacto
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
