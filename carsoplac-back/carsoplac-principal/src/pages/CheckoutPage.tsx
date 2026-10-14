import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useCart } from "../context/CartContext";
import { getWhatsAppUrl } from "../config/whatsapp";
import Seo from "../components/Seo";
import { cloudinaryUrl } from "../lib/cloudinary";

// ──────────────────────────────────────────────────────────────
// Checkout sin backend de órdenes.
// - Los datos del formulario viven SOLO en estado local: no se
//   envían a ningún servidor todavía.
// - El total del resumen es solo informativo: cuando exista
//   POST /orders, el backend recalculará precios y totales.
// ──────────────────────────────────────────────────────────────

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zip: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_FORM: FormData = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  province: "",
  zip: "",
  notes: "",
};

// Validación manual: no hay react-hook-form ni zod instalados.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Código postal argentino: 4 dígitos (ej. 1824) o CPA (ej. C1425DQA).
const ZIP_RE = /^\d{4}$|^[A-Za-z]\d{4}[A-Za-z]{3}$/;

// Teléfono argentino: acepta +54, 9, espacios y guiones; 8 a 13 dígitos.
function isValidArPhone(raw: string): boolean {
  if (/[^\d+\-\s()]/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 13;
}

function validate(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (form.fullName.trim().length < 3) {
    errors.fullName = "Ingresá tu nombre completo (mínimo 3 caracteres).";
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = "Ingresá un email válido.";
  }
  if (!isValidArPhone(form.phone.trim())) {
    errors.phone = "Ingresá un teléfono válido (ej. 11 2345 6789).";
  }
  if (!form.street.trim()) {
    errors.street = "Ingresá calle y número.";
  }
  if (!form.city.trim()) {
    errors.city = "Ingresá tu localidad.";
  }
  if (!form.province.trim()) {
    errors.province = "Ingresá tu provincia.";
  }
  if (!ZIP_RE.test(form.zip.trim())) {
    errors.zip = "CP de 4 dígitos (ej. 1824) o CPA (ej. C1425DQA).";
  }
  return errors;
}

// Mismo formato que CartDrawer para consistencia.
const formatPrice = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

type TextFieldDef = {
  name: keyof FormData;
  label: string;
  type: string;
  autoComplete: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  placeholder?: string;
};

const TEXT_FIELDS: TextFieldDef[] = [
  { name: "fullName", label: "Nombre completo", type: "text", autoComplete: "name", placeholder: "Ej. Juan Pérez" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email", placeholder: "juan@email.com" },
  { name: "phone", label: "Teléfono", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "Ej. 11 2345 6789" },
  { name: "street", label: "Calle y número", type: "text", autoComplete: "address-line1", placeholder: "Ej. Av. San Martín 4520" },
  { name: "city", label: "Localidad", type: "text", autoComplete: "address-level2", placeholder: "Ej. Banfield" },
  { name: "province", label: "Provincia", type: "text", autoComplete: "address-level1", placeholder: "Ej. Buenos Aires" },
  { name: "zip", label: "Código postal", type: "text", autoComplete: "postal-code", placeholder: "Ej. 1824 o C1425DQA" },
];

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-shaded-fern px-4 py-3 text-sm text-white placeholder:text-sage-gray focus:outline-none transition ${
    hasError
      ? "border-[rgb(var(--color-danger-border))] focus:ring-2 focus:ring-[rgb(var(--color-danger-border))]"
      : "border-spruce-border focus:border-accent-brand focus:ring-2 focus:ring-accent-brand"
  }`;

export default function CheckoutPage() {
  const { cart, total, totalItems } = useCart();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);

  const hasItems = cart.length > 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    // Después del primer intento de envío, validar en cada cambio.
    if (submitted) setErrors(validate(nextForm));
  };

  // Los datos NO se envían a ningún servidor: solo validamos localmente.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setErrors(validate(form));
  };

  const isValid = Object.keys(validate(form)).length === 0;

  // Pedido por WhatsApp: abre el chat con el resumen del carrito y los datos
  // del comprador. No vacía el carrito: la confirmación ocurre en el chat.
  const handleWhatsAppOrder = () => {
    if (!isValid || !hasItems) return;
    const lines: string[] = [
      "¡Hola! Quiero hacer un pedido:",
      "",
      ...cart.map(
        (item) =>
          `• ${item.quantity} x ${item.name} – ${formatPrice(item.price * item.quantity)}`,
      ),
      "",
      `Total: ${formatPrice(total)}`,
      "",
      "Mis datos:",
      `Nombre: ${form.fullName.trim()}`,
      `Teléfono: ${form.phone.trim()}`,
      `Dirección: ${form.street.trim()}, ${form.city.trim()}, ${form.province.trim()} (CP ${form.zip.trim()})`,
    ];
    if (form.notes.trim()) {
      lines.push(`Notas: ${form.notes.trim()}`);
    }
    // getWhatsAppUrl ya aplica encodeURIComponent al mensaje.
    const url = getWhatsAppUrl(lines.join("\n"));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Carrito vacío: mensaje con botón "Ver productos", sin formulario.
  if (!hasItems) {
    return (
      <div className="container-x pt-12 pb-20 text-white">
        <Seo
          title="Checkout"
          description="Finalizá tu compra en Carsoplac. Envíos a todo el país, directo de fábrica."
          noindex
        />
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-3 text-sage-gray">Tu carrito está vacío.</p>
        <Link to="/productos" className="btn btn-primary mt-6 inline-block">
          Ver productos
        </Link>
      </div>
    );
  }

  // Resumen del carrito (reutilizado en mobile colapsable y en el aside sticky).
  const summaryBody = (
    <>
      <ul className="divide-y divide-spruce-border">
        {cart.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-midnight-forest shrink-0">
              {item.image ? (
                <img
                  src={cloudinaryUrl(item.image, 150)}
                  alt={item.name}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-[10px] font-bold text-sage-gray">
                  CP
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-sage-gray mt-0.5">
                {item.quantity} x {formatPrice(item.price)}
              </p>
            </div>
            <p className="text-sm font-medium shrink-0">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-spruce-border pt-3 mt-1">
        <span className="text-sm text-sage-gray">Total</span>
        {/* Total informativo: el backend lo recalculará cuando exista /orders */}
        <span className="text-xl font-semibold">{formatPrice(total)}</span>
      </div>
    </>
  );

  return (
    <div className="container-x pt-10 pb-20 text-white">
      <Seo
        title="Checkout"
        description="Completá tus datos de envío y coordiná tu pedido con envío a todo el país."
        noindex
      />
      <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
      <p className="mt-2 text-sm text-sage-gray">
        Completá tus datos para coordinar el pedido y la entrega.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-5 items-start">
        {/* ── Formulario del comprador (izquierda en desktop) ── */}
        <section
          aria-labelledby="checkout-form-heading"
          className="order-2 lg:order-1 lg:col-span-3 rounded-xl border border-spruce-border bg-shaded-fern p-5 sm:p-7"
        >
          <h2 id="checkout-form-heading" className="h2">
            Datos del comprador
          </h2>

          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map((field) => {
                const error = errors[field.name];
                const isWide = field.name === "fullName" || field.name === "email";
                return (
                  <div
                    key={field.name}
                    className={`flex flex-col gap-1.5 ${isWide ? "sm:col-span-2" : ""}`}
                  >
                    <label htmlFor={field.name} className="text-sm font-semibold">
                      {field.label} <span className="text-accent-brand">*</span>
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={form[field.name]}
                      onChange={handleChange}
                      autoComplete={field.autoComplete}
                      inputMode={field.inputMode}
                      placeholder={field.placeholder}
                      aria-invalid={!!error}
                      aria-describedby={error ? `${field.name}-error` : undefined}
                      className={inputClass(!!error)}
                    />
                    {error && (
                      <p
                        id={`${field.name}-error`}
                        role="alert"
                        className="text-xs font-medium text-[rgb(var(--color-danger-text))]"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Notas (opcional) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-sm font-semibold">
                Notas <span className="text-xs font-normal text-sage-gray">(opcional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                placeholder="Ej. entregas de lunes a viernes por la tarde"
                aria-describedby="notes-hint"
                className={`${inputClass(false)} resize-y min-h-[80px]`}
              />
              <p id="notes-hint" className="text-xs text-sage-gray">
                Referencias para la entrega, horarios, etc.
              </p>
            </div>

            {/* Botón principal: habilitado solo con formulario válido e ítems. */}
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              disabled={!isValid || !hasItems}
              className="btn btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pedir por WhatsApp
            </button>

            {/* Pago online sin conectar: el flujo de preferencias de MercadoPago
                todavía no está disponible (no hay POST /orders funcional). */}
            <button
              type="button"
              disabled
              title="Disponible próximamente"
              className="btn btn-outline w-full mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Pago online: próximamente
            </button>

            <p className="text-xs text-sage-gray">
              Se abre WhatsApp con el resumen de tu pedido. El carrito no se
              vacía automáticamente.
            </p>
          </form>
        </section>

        {/* ── Resumen: arriba y colapsable en mobile, sticky a la derecha en desktop ── */}
        <aside
          aria-label="Resumen del pedido"
          className="order-1 lg:order-2 lg:col-span-2 self-start rounded-xl border border-spruce-border bg-shaded-fern"
        >
          <button
            type="button"
            onClick={() => setShowSummaryMobile((v) => !v)}
            aria-expanded={showSummaryMobile}
            aria-controls="checkout-summary"
            className="w-full flex items-center justify-between gap-3 px-5 py-4 lg:pointer-events-none"
          >
            <span className="text-sm font-semibold">
              Resumen del pedido ({totalItems})
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base font-semibold">{formatPrice(total)}</span>
              <ChevronDown
                size={16}
                aria-hidden
                className={`transition-transform lg:hidden ${showSummaryMobile ? "rotate-180" : ""}`}
              />
            </span>
          </button>
          <div
            id="checkout-summary"
            className={`${showSummaryMobile ? "block" : "hidden"} lg:block border-t border-spruce-border px-5 py-2 lg:border-t-0`}
          >
            {summaryBody}
          </div>
        </aside>
      </div>
    </div>
  );
}
