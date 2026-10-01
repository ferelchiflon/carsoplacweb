import { Link } from "react-router-dom";
import { Link as LinkIcon } from "lucide-react";
import SectionHeader from "../components/ui/SectionHeader";
import fotoFabrica from "../assets/imagenes/foto-fabrica.jpeg";
import logoCarso from "../assets/imagenes/logo.png";
import sello from "../assets/imagenes/sello-1.png";
import placa1 from "../assets/imagenes/placa1.png";

// ──────────────────────────────────────────────────────────────
// Datos de la empresa CARSOPLAC
// ──────────────────────────────────────────────────────────────
const stats = [
  { number: "+15", label: "Años fabricando" },
  { number: "12", label: "Cuotas sin interés" },
  { number: "100%", label: "Fabricación propia" },
  { number: "24/48h", label: "Despacho a todo el país" },
];

const values = [
  {
    title: "Fabricación propia",
    description:
      "Producimos cada pieza en nuestra planta. Sin intermediarios, con control total de calidad.",
  },
  {
    title: "Diseño industrial",
    description:
      "Mesadas, revestimientos y muebles con líneas modernas pensadas para durar y resistir.",
  },
  {
    title: "Envíos seguros",
    description:
      "Embalaje reforzado y despacho coordinado a cualquier punto del país con seguimiento.",
  },
  {
    title: "Pagos en cuotas",
    description:
      "Hasta 12 cuotas sin interés con MercadoPago. Compra 100% segura y protegida.",
  },
];

const categories = [
  { name: "Mesadas", href: "/productos" },
  { name: "Revestimientos", href: "/productos" },
  { name: "Muebles", href: "/productos" },
  { name: "Accesorios", href: "/productos" },
];

export default function AboutPage() {
  return (
    <div className="bg-midnight-forest text-white">
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${fotoFabrica})` }}
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-midnight-forest/85 via-midnight-forest/70 to-midnight-forest/90" />

        <div className="container-x py-16 sm:py-24 lg:py-32 text-white">
          <div className="max-w-3xl">
            <span className="eyebrow text-accent-brand">
              Sobre Carsoplac
            </span>
            <h1 className="display mt-4 text-white">
              Fabricamos lo que tu hogar necesita,
              <br className="hidden sm:block" />
              <span className="text-accent-brand">
                {" "}
                directo de fábrica.
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-sage-gray leading-relaxed max-w-2xl">
              Somos una fábrica argentina especializada en mesadas, revestimientos
              y muebles de diseño industrial. Producimos nosotros, vendemos
              nosotros y garantizamos cada pieza que sale de nuestra planta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/productos" className="btn btn-secondary">
                Ver catálogo
              </Link>
              <Link
                to="/contacto"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                Hablar con un asesor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── STATS BAR ─────────────── */}
      <section className="container-x -mt-10 sm:-mt-14 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-spruce-border rounded-xl overflow-hidden ">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-deep-lichen p-5 sm:p-7 text-center"
            >
              <div className="h2 text-white">
                {s.number}
              </div>
              <p className="mt-1 text-xs sm:text-sm uppercase tracking-wider font-semibold text-sage-gray">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── QUIÉNES SOMOS ─────────────── */}
      <section className="container-x py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Texto */}
          <div>
            <span className="eyebrow">Quiénes somos</span>
            <h2 className="h2 mt-3">
              Una fábrica, un equipo, un mismo oficio.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-sage-gray leading-relaxed">
              Carsoplac nace hace más de 15 años con una idea clara: fabricar
              mesadas y revestimientos de calidad industrial, con diseño
              moderno y a un precio justo. Hoy seguimos trabajando igual que el
              primer día: con la misma dedicación y la misma responsabilidad de
              poner nuestro nombre en cada pieza.
            </p>
            <p className="mt-4 text-base sm:text-lg text-sage-gray leading-relaxed">
              Atendemos tanto a familias que renuevan su cocina como a
              arquitectos, constructoras y locales comerciales que necesitan un
              proveedor serio, con stock real y entregas puntuales.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.name}
                  to={c.href}
                  className="chip hover:bg-mossy-edge transition"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Imagen fábrica */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-xl overflow-hidden border border-spruce-border">
              <img
                src={fotoFabrica}
                alt="Planta de fabricación Carsoplac"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden sm:block bg-deep-lichen border border-spruce-border rounded-xl  p-4 max-w-[220px]">
              <div className="flex items-center gap-3">
                <img
                  src={sello}
                  alt="Sello de calidad"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-white">
                    Garantía oficial
                  </p>
                  <p className="text-xs text-sage-gray">
                    Respaldamos cada producto que sale de planta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── VALORES ─────────────── */}
      <section className="bg-shaded-fern text-white py-16 sm:py-24">
        <div className="container-x">
          <SectionHeader
            title="NUESTROS VALORES"
            subtitle="Lo que nos diferencia"
            onViewAll={() => undefined}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="card text-white p-6 sm:p-7 card-hover"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent-brand/15 grid place-items-center text-accent-brand font-extrabold">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <h3 className="h2 tracking-tight">
                  {v.title}
                </h3>
                <p className="mt-2 copy">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── PRODUCTO ESTRELLA ─────────────── */}
      <section className="container-x py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="aspect-square rounded-xl overflow-hidden border border-spruce-border bg-shaded-fern">
              <img
                src={placa1}
                alt="Placa decorativa Carsoplac"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="eyebrow">Cómo trabajamos</span>
            <h2 className="h2 mt-3">
              Diseño, corte y terminación en un solo lugar.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-sage-gray leading-relaxed">
              Todas nuestras piezas se producen en nuestra propia planta. Eso
              nos permite controlar el proceso completo: desde la selección de
              la materia prima hasta el empaquetado final. El resultado es un
              producto consistente, con terminaciones prolijas y un estándar de
              calidad que podés ver y tocar.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "Materia prima seleccionada y trazable.",
                "Corte y terminación con maquinaria industrial.",
                "Control de calidad antes de cada despacho.",
                "Embalaje reforzado para envíos a todo el país.",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-white"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-brand shrink-0" />
                  <span className="text-base">{line}</span>
                </li>
              ))}
            </ul>

            <Link to="/productos" className="btn btn-primary mt-8">
              Conocé nuestros productos
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────── CTA FINAL ─────────────── */}
      <section className="container-x pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-shaded-fern via-mossy-edge to-deep-lichen p-8 sm:p-14 text-white">
          <div className="absolute -right-10 -bottom-10 opacity-10 hidden sm:block">
            <img
              src={logoCarso}
              alt=""
              className="w-64 h-64 object-contain"
              aria-hidden
            />
          </div>

          <div className="relative max-w-2xl">
            <span className="eyebrow text-accent-brand">
              ¿Listo para empezar?
            </span>
            <h2 className="h2 mt-3">
              Pedí tu presupuesto sin compromiso.
            </h2>
            <p className="mt-4 text-sage-gray text-base sm:text-lg leading-relaxed">
              Contanos qué necesitás y te respondemos a la brevedad con una
              cotización personalizada. Atendemos por WhatsApp, email o en
              nuestro showroom.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/contacto" className="btn btn-secondary">
                Solicitar presupuesto
              </Link>
              <a
                href="https://wa.me/5491100000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                <LinkIcon size={16} />
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
