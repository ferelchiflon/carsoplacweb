import { useState } from "react";
import {
  ChevronDown,
  Instagram,
  Phone,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Truck,
  CreditCard,
  RotateCcw,
  Award,
} from "lucide-react";

type Item = {
  title: string;
  content: { label: string; href?: string }[];
};

// 🛡️ Regex de email razonable (cubre la mayoría de casos reales sin ser invasivo)
const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const sections: Item[] = [
  {
    title: "CarsoPlac",
    content: [
      { label: "Productos", href: "#productos" },
      { label: "Nosotros", href: "#nosotros" },
      { label: "Servicios", href: "#servicios" },
      { label: "Cambios y devoluciones", href: "#cambios" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
  {
    title: "Categorías",
    content: [
      { label: "Mesadas", href: "#mesadas" },
      { label: "Revestimientos", href: "#revestimientos" },
      { label: "Muebles", href: "#muebles" },
      { label: "Accesorios", href: "#accesorios" },
    ],
  },
  {
    title: "Ayuda",
    content: [
      { label: "Preguntas frecuentes" },
      { label: "Envíos y entregas" },
      { label: "Medios de pago" },
      { label: "Garantía oficial" },
      { label: "Política de privacidad" },
    ],
  },
];

const trustBadges = [
  { Icon: Truck, label: "Envío a todo el país" },
  { Icon: ShieldCheck, label: "Compra 100% segura" },
  { Icon: CreditCard, label: "Hasta 12 cuotas" },
  { Icon: RotateCcw, label: "Devolución gratis" },
];

export default function FooterAcordeonMobile() {
  const [open, setOpen] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Si ya había error y el usuario está escribiendo, lo limpiamos en vivo
    if (emailError) {
      const value = e.target.value.trim();
      if (value.length === 0 || EMAIL_REGEX.test(value)) {
        setEmailError(null);
      }
    }
  };

  const handleEmailBlur = () => {
    setTouched(true);
    const value = email.trim();
    if (value.length === 0) {
      setEmailError(null); // el atributo `required` ya cubre el caso vacío
    } else if (!EMAIL_REGEX.test(value)) {
      setEmailError("Ingresá un email válido.");
    } else {
      setEmailError(null);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();

    if (value.length === 0) {
      setEmailError("El email es obligatorio.");
      return;
    }

    if (!EMAIL_REGEX.test(value)) {
      setEmailError("Ingresá un email válido.");
      return;
    }

    setSubscribed(true);
    setEmail("");
    setEmailError(null);
    setTouched(false);
    setTimeout(() => setSubscribed(false), 3500);
  };

  const showError = touched && Boolean(emailError);

  return (
    <footer className="w-full bg-[rgb(var(--primary))] text-white">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
          {trustBadges.map(({ Icon, label }, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-2 py-4 px-3 text-center"
            >
              <Icon size={18} className="shrink-0 text-white/90" />
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="px-5 py-7 border-b border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Award size={18} className="text-white/80" />
          <p className="eyebrow text-white/70">Club CarsoPlac</p>
        </div>
        <h3 className="text-xl font-extrabold leading-tight mb-1">
          Recibí ofertas exclusivas
        </h3>
        <p className="text-sm text-white/70 mb-4 leading-snug">
          Suscribite y enterate primero de lanzamientos, descuentos y novedades.
        </p>

        <form onSubmit={handleSubscribe} noValidate className="flex items-stretch gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder="tu@email.com"
            aria-invalid={showError}
            aria-describedby={showError ? "newsletter-email-error" : undefined}
            className={`flex-1 h-11 rounded-full bg-white/10 border px-4 text-sm placeholder-white/50 text-white focus:outline-none transition ${
              showError
                ? "border-[rgb(var(--accent))] focus:border-[rgb(var(--accent))] bg-white/15"
                : "border-white/15 focus:border-white/40 focus:bg-white/15"
            }`}
          />
          <button
            type="submit"
            aria-label="Suscribirme"
            className="h-11 w-11 grid place-items-center rounded-full bg-white text-[rgb(var(--primary))] hover:scale-105 active:scale-95 transition"
          >
            <Send size={16} />
          </button>
        </form>
        {showError && (
          <p
            id="newsletter-email-error"
            className="text-xs text-[rgb(var(--accent))] mt-2"
            role="alert"
          >
            {emailError}
          </p>
        )}
        {subscribed && (
          <p className="text-xs text-white/80 mt-2">
            ¡Listo! Te suscribiste correctamente.
          </p>
        )}
      </div>

      {/* Sections accordion */}
      <div className="px-5 py-4">
        {sections.map((item, i) => (
          <div key={i} className="border-b border-white/10">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex justify-between items-center text-left py-4"
              aria-expanded={open === i}
            >
              <span className="text-sm font-bold uppercase tracking-wider">
                {item.title}
              </span>
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 text-white/70 ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {open === i && (
              <ul className="pb-4 space-y-3">
                {item.content.map((c, idx) => (
                  <li key={idx}>
                    <a
                      href={c.href || "#"}
                      className="text-sm text-white/70 hover:text-white transition"
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Contact block */}
      <div className="px-5 py-6 border-t border-white/10 space-y-3">
        <p className="eyebrow text-white/70">Contacto</p>
        <a
          href="tel:+5491100000000"
          className="flex items-center gap-3 text-sm hover:text-white/90"
        >
          <Phone size={16} className="text-white/70" />
          +54 9 11 0000 0000
        </a>
        <a
          href="mailto:hola@carsoplac.com"
          className="flex items-center gap-3 text-sm hover:text-white/90"
        >
          <Mail size={16} className="text-white/70" />
          hola@carsoplac.com
        </a>
        <p className="flex items-center gap-3 text-sm text-white/80">
          <MapPin size={16} className="text-white/70" />
          Buenos Aires, Argentina
        </p>
      </div>

      {/* Social + copyright */}
      <div className="px-5 py-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <Instagram size={18} />
          </a>
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <Phone size={18} />
          </a>
        </div>
        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} CarsoPlac. Todos los derechos reservados.
        </p>
        <p className="text-[11px] text-white/40 mt-1">
          Hecho con ♥ en Argentina
        </p>
      </div>
    </footer>
  );
}
