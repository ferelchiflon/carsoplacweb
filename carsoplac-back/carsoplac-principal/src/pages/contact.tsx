import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Datos reales de Carsoplac (alineados con Footer / MobileMenu)
// ──────────────────────────────────────────────────────────────
const CONTACT = {
  whatsappDisplay: "+54 9 11 5823 4493",
  whatsappRaw: "5491158234493",
  whatsappDefaultMessage:
    "¡Hola! Vi su tienda y me gustaría hacerles una consulta sobre sus productos.",
  email: "hola@carsoplac.com",
  address: "Av. San Martín 4520, CABA, Buenos Aires, Argentina",
  city: "Buenos Aires, Argentina",
  hours: "Lunes a Viernes de 9:00 a 18:00 hs · Sábados de 9:00 a 13:00 hs",
  instagram: "https://instagram.com/carsoplac",
};

const SUBJECTS = [
  { value: "", label: "Seleccioná un tema" },
  { value: "consulta", label: "Consulta general" },
  { value: "pedido", label: "Estado de mi pedido" },
  { value: "presupuesto", label: "Pedir presupuesto" },
  { value: "devolucion", label: "Devolución o cambio" },
  { value: "producto", label: "Consulta sobre producto" },
  { value: "mayorista", label: "Ventas mayoristas" },
  { value: "otro", label: "Otro" },
];

// ──────────────────────────────────────────────────────────────
// Tipos del formulario
// ──────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ─────────────── Validación ───────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresá un email válido";
    }

    if (!formData.message.trim()) {
      newErrors.message = "El mensaje es obligatorio";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─────────────── Submit ───────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Reemplazar por integración real con backend / servicio de mail
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log("Consulta enviada:", formData);
      setIsSuccess(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Error al enviar la consulta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────── Cambio de inputs ───────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ─────────────── WhatsApp ───────────────
  const openWhatsApp = () => {
    const url = `https://wa.me/${CONTACT.whatsappRaw}?text=${encodeURIComponent(
      CONTACT.whatsappDefaultMessage,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white text-[rgb(var(--primary))]">
      {/* ─────────────── HERO ─────────────── */}
      <section className="relative isolate overflow-hidden bg-[rgb(var(--primary))] text-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[rgb(var(--primary))] via-[rgb(15,15,15)] to-[rgb(var(--primary))] opacity-95" />
        <div className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-[rgb(var(--secondary))]/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 -z-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="container-x py-16 sm:py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="eyebrow text-[rgb(var(--secondary))]">
              Hablemos
            </span>
            <h1 className="display-1 mt-4 text-white">
              Contacto
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl">
              ¿Tenés alguna consulta sobre nuestros productos, necesitás un
              presupuesto o querés asesoramiento? Elegí el canal que prefieras
              y te respondemos a la brevedad.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────── CONTENIDO ─────────────── */}
      <section className="container-x py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 items-start">
          {/* ─────────── Columna izquierda: WhatsApp + Info ─────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Tarjeta WhatsApp */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white p-6 sm:p-8 shadow-[0_18px_50px_rgba(37,211,102,0.25)]">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-white/20 grid place-items-center mb-5">
                  <MessageCircle size={28} className="text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Chateá con nosotros
                </h3>
                <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed">
                  Te respondemos en el día por WhatsApp. Atención personalizada
                  de lunes a sábados.
                </p>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="btn mt-6 bg-white text-[#128C7E] hover:brightness-95 active:scale-[0.98] !rounded-full"
                >
                  <MessageCircle size={18} />
                  Iniciar conversación
                </button>
              </div>
            </div>

            {/* Tarjeta info de contacto */}
            <div className="card p-6 sm:p-7">
              <p className="eyebrow mb-4">Información</p>
              <h3 className="display-3 text-[rgb(var(--primary))]">
                Nuestros canales
              </h3>

              <ul className="mt-5 divide-y divide-[rgb(var(--line))]">
                {/* Teléfono */}
                <li className="flex items-start gap-4 py-4">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-[rgb(var(--neutral))] grid place-items-center">
                    <Phone size={18} className="text-[rgb(var(--primary))]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[rgb(var(--muted))]">
                      Teléfono / WhatsApp
                    </p>
                    <a
                      href={`https://wa.me/${CONTACT.whatsappRaw}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-0.5 text-[15px] font-semibold text-[rgb(var(--primary))] hover:text-[rgb(var(--accent))] transition break-all"
                    >
                      {CONTACT.whatsappDisplay}
                    </a>
                  </div>
                </li>

                {/* Email */}
                <li className="flex items-start gap-4 py-4">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-[rgb(var(--neutral))] grid place-items-center">
                    <Mail size={18} className="text-[rgb(var(--primary))]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[rgb(var(--muted))]">
                      Email
                    </p>
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="block mt-0.5 text-[15px] font-semibold text-[rgb(var(--primary))] hover:text-[rgb(var(--accent))] transition break-all"
                    >
                      {CONTACT.email}
                    </a>
                  </div>
                </li>

                {/* Dirección */}
                <li className="flex items-start gap-4 py-4">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-[rgb(var(--neutral))] grid place-items-center">
                    <MapPin size={18} className="text-[rgb(var(--primary))]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[rgb(var(--muted))]">
                      Showroom / Fábrica
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-[rgb(var(--primary))] leading-snug">
                      {CONTACT.address}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-1">
                      {CONTACT.city}
                    </p>
                  </div>
                </li>

                {/* Horario */}
                <li className="flex items-start gap-4 py-4">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-[rgb(var(--neutral))] grid place-items-center">
                    <Clock size={18} className="text-[rgb(var(--primary))]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[rgb(var(--muted))]">
                      Horario de atención
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-[rgb(var(--primary))] leading-snug">
                      {CONTACT.hours}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* ─────────── Columna derecha: Formulario ─────────── */}
          <div className="lg:col-span-3">
            <div className="card p-6 sm:p-8 lg:p-10 shadow-[0_18px_50px_rgba(26,26,26,0.08)]">
              <p className="eyebrow">Formulario</p>
              <h2 className="display-2 mt-2 text-[rgb(var(--primary))]">
                Envianos tu consulta
              </h2>
              <p className="mt-3 text-[rgb(var(--muted))] text-base leading-relaxed">
                Completá los datos y te respondemos a la brevedad. Los campos
                marcados con <span className="text-[rgb(var(--accent))]">*</span>{" "}
                son obligatorios.
              </p>

              {/* Mensaje de éxito */}
              {isSuccess && (
                <div
                  role="status"
                  className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm font-medium"
                >
                  <CheckCircle2 size={20} className="shrink-0" />
                  ¡Mensaje enviado con éxito! Te responderemos pronto.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" noValidate>
                {/* Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-[rgb(var(--primary))]"
                  >
                    Nombre completo{" "}
                    <span className="text-[rgb(var(--accent))]">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    aria-invalid={!!errors.name}
                    className={`input-base !h-12 ${
                      errors.name
                        ? "!ring-2 !ring-[rgb(var(--accent))] !bg-red-50/40"
                        : ""
                    }`}
                  />
                  {errors.name && (
                    <span className="text-xs text-[rgb(var(--accent))] font-medium">
                      {errors.name}
                    </span>
                  )}
                </div>

                {/* Email + Teléfono */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-[rgb(var(--primary))]"
                    >
                      Email{" "}
                      <span className="text-[rgb(var(--accent))]">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tumail@ejemplo.com"
                      aria-invalid={!!errors.email}
                      className={`input-base !h-12 ${
                        errors.email
                          ? "!ring-2 !ring-[rgb(var(--accent))] !bg-red-50/40"
                          : ""
                      }`}
                    />
                    {errors.email && (
                      <span className="text-xs text-[rgb(var(--accent))] font-medium">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="phone"
                      className="text-sm font-semibold text-[rgb(var(--primary))]"
                    >
                      Teléfono
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+54 11 0000-0000"
                      className="input-base !h-12"
                    />
                  </div>
                </div>

                {/* Asunto */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="subject"
                    className="text-sm font-semibold text-[rgb(var(--primary))]"
                  >
                    Asunto
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-base !h-12 !appearance-none !bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%231e1e1e%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%226%209%2012%2015%2018%209%22/></svg>')] !bg-[length:16px_16px] !bg-[right_1.25rem_center] !bg-no-repeat !pr-12 cursor-pointer"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mensaje */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="message"
                    className="text-sm font-semibold text-[rgb(var(--primary))]"
                  >
                    Mensaje{" "}
                    <span className="text-[rgb(var(--accent))]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Contanos en qué podemos ayudarte..."
                    rows={6}
                    aria-invalid={!!errors.message}
                    className={`w-full rounded-2xl bg-[rgb(var(--neutral))] px-5 py-3.5 text-sm placeholder:text-[rgb(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition resize-y min-h-[140px] ${
                      errors.message
                        ? "!ring-2 !ring-[rgb(var(--accent))] !bg-red-50/40"
                        : ""
                    }`}
                  />
                  {errors.message && (
                    <span className="text-xs text-[rgb(var(--accent))] font-medium">
                      {errors.message}
                    </span>
                  )}
                </div>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-[rgb(var(--muted))] leading-snug">
                    Al enviar aceptás que te contactemos por los medios
                    indicados.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary !rounded-full w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
