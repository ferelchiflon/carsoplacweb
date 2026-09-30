import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, User, ShoppingCart } from "lucide-react";
import LOGO from "../../assets/imagenes/LOGO CARSO.png";
import { useCart } from "../../context/CartContext";

const NAV = [
  { label: "Inicio", to: "/" },
  { label: "Catálogo", to: "/productos" },
  { label: "Nosotros", to: "/nosotros" },
  { label: "Contacto", to: "/contacto" },
];

type Props = {
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
};

export default function Navbar({ onOpenCart, onOpenSearch, onOpenMobileMenu }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const raf = useRef<number | null>(null);

  // La barra es siempre oscura (bg-shaded-fern), así que el logo va en blanco
  // en los dos estados: constante y sin flash de color en el primer render.
  const logoFilter = "brightness(0) invert(1)";

  // Clases compartidas de los botones de acción (búsqueda, cuenta, carrito).
  // Lucide usa currentColor, así que el color del icono se controla con
  // la clase de texto.
  const iconBtnBase =
    "w-10 h-10 place-items-center rounded-full transition cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2";
  const iconBtnState = "hover:bg-white/10 focus-visible:outline-accent-brand";
  const iconColor = "text-white";

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => setScrolled(window.scrollY > 12));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-spruce-border transition-all duration-300 ${
        scrolled ? "bg-shaded-fern/95 backdrop-blur-xl" : "bg-shaded-fern"
      }`}
    >
      <div className={`container-x flex items-center justify-between transition-all ${scrolled ? "h-16" : "h-20"}`}>
        {/* Mobile: burger + logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onOpenMobileMenu}
            aria-label="Abrir menú"
            className="w-10 h-10 grid place-items-center rounded-full cursor-pointer hover:bg-white/10 transition"
          >
            <span className="block w-5 h-px bg-white relative before:content-[''] before:absolute before:w-5 before:h-px before:-top-1.5 before:left-0 before:bg-white after:content-[''] after:absolute after:w-5 after:h-px after:top-1.5 after:left-0 after:bg-white" />
          </button>
        </div>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={LOGO}
            alt="Carsoplac"
            width={160}
            height={48}
            decoding="async"
            fetchPriority="high"
            // Solo animamos la altura; el filter va inline para que el primer
            // render ya salga con el tratamiento correcto (sin flash del logo
            // a color sobre fondo grafito) y para no chocar con utility classes.
            className={`w-auto transition-[height] duration-300 ${scrolled ? "h-9" : "h-12"}`}
            style={{ filter: logoFilter }}
          />
          <div className="hidden sm:flex flex-col leading-none text-white">
            <span className="text-lg font-extrabold tracking-tight">CARSOPLAC</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-sage-gray">Fabricación propia</span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-semibold rounded-full transition ${
                  isActive
                    ? "text-accent-brand"
                    : "text-sage-gray hover:text-white hover:bg-white/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSearch}
            aria-label="Buscar"
            title="Buscar productos"
            className={`${iconBtnBase} grid ${iconBtnState}`}
          >
            <Search size={20} strokeWidth={1.8} className={`transition-colors ${iconColor}`} />
          </button>

          <button
            onClick={() => navigate("/login")}
            aria-label="Mi cuenta"
            title="Mi cuenta"
            className={`${iconBtnBase} hidden sm:grid ${iconBtnState}`}
          >
            <User size={20} strokeWidth={1.8} className={`transition-colors ${iconColor}`} />
          </button>

          <button
            onClick={onOpenCart}
            aria-label="Carrito"
            title="Ver carrito"
            className={`${iconBtnBase} relative grid ${iconBtnState}`}
          >
            <ShoppingCart size={20} strokeWidth={1.8} className={`transition-colors ${iconColor}`} />
            {totalItems > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center text-[10px] font-bold bg-accent-brand text-midnight-forest ring-2 ring-shaded-fern"
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
