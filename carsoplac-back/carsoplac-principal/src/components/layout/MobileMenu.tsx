// src/components/layout/MobileMenu.tsx
import {
  X,
  ChevronDown,
  ArrowRight,
  Search,
  User,
  Heart,
  Package,
  HelpCircle,
  Phone,
  Tag,
  Sparkles,
  Layers,
  Home as HomeIcon,
  Wrench,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type CatItem = { name: string; to: string; Icon: typeof Layers };

const categories: CatItem[] = [
  { name: "Mesadas", to: "/productos?cat=mesadas", Icon: Layers },
  { name: "Revestimientos", to: "/productos?cat=revestimientos", Icon: HomeIcon },
  { name: "Muebles", to: "/productos?cat=muebles", Icon: Briefcase },
  { name: "Accesorios", to: "/productos?cat=accesorios", Icon: Wrench },
];

const promoLinks = [
  { label: "Ofertas", to: "/productos?filter=ofertas", tag: "HOT" },
  { label: "Novedades", to: "/productos?filter=nuevos", tag: "NEW" },
  { label: "Más vendidos", to: "/productos?filter=top", tag: "TOP" },
];

// ⚠️ Rutas que NO existen todavía → se renderizan como placeholder
// (botón deshabilitado con badge "Pronto" y tooltip accesible).
type AccountItem = {
  label: string;
  to: string;
  Icon: typeof User;
  disabled?: boolean;
};

const accountLinks: AccountItem[] = [
  { label: "Mi cuenta", to: "/cuenta", Icon: User, disabled: true },
  { label: "Mis pedidos", to: "/cuenta/pedidos", Icon: Package, disabled: true },
  { label: "Favoritos", to: "/cuenta/favoritos", Icon: Heart, disabled: true },
  { label: "Ayuda", to: "/ayuda", Icon: HelpCircle, disabled: true },
];

// Otros items del menú (también tipados para soportar placeholders).
type NavItem = {
  label: string;
  to: string;
  Icon: typeof User;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  { label: "Nosotros", to: "/nosotros", Icon: User },
  { label: "Catálogo", to: "/productos", Icon: Tag },
  { label: "Servicios", to: "/servicios", Icon: Wrench, disabled: true },
  { label: "Contacto", to: "/contacto", Icon: Phone },
];

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [openProducts, setOpenProducts] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  const close = () => onClose();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    close();
  };

  // Render unificado para items: si está deshabilitado, muestra botón
  // no-enrutable con badge "Pronto"; si no, usa <Link>.
  const renderItem = (
    item: NavItem | AccountItem,
    layout: "row" | "chip"
  ) => {
    const baseRow =
      "flex items-center gap-3 py-3.5 w-full text-left cursor-pointer";
    const baseChip =
      "flex items-center gap-2 py-2.5 px-3 rounded-xl transition";

    if (item.disabled) {
      return (
        <button
          key={item.to}
          type="button"
          disabled
          aria-disabled="true"
          title="Próximamente disponible"
          className={
            layout === "row"
              ? `${baseRow} opacity-50 cursor-not-allowed`
              : `${baseChip} bg-[rgb(var(--neutral))] opacity-50 cursor-not-allowed`
          }
        >
          <span className="w-9 h-9 grid place-items-center rounded-full bg-[rgb(var(--neutral))]">
            <item.Icon
              size={layout === "row" ? 16 : 15}
              className="text-[rgb(var(--primary))]"
            />
          </span>
          <span
            className={
              layout === "row"
                ? "text-[15px] font-semibold flex-1"
                : "text-[13px] font-semibold flex-1"
            }
          >
            {item.label}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[rgb(var(--accent))] text-white px-1.5 py-0.5 rounded-full">
            Pronto
          </span>
        </button>
      );
    }

    if (layout === "row") {
      return (
        <Link
          key={item.to}
          to={item.to}
          onClick={close}
          className={baseRow}
        >
          <span className="w-9 h-9 grid place-items-center rounded-full bg-[rgb(var(--neutral))]">
            <item.Icon size={16} className="text-[rgb(var(--primary))]" />
          </span>
          <span className="text-[15px] font-semibold flex-1">
            {item.label}
          </span>
          <ArrowRight size={16} className="opacity-50" />
        </Link>
      );
    }

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={close}
        className={`${baseChip} bg-[rgb(var(--neutral))] hover:bg-[rgb(var(--line))]`}
      >
        <item.Icon size={15} className="text-[rgb(var(--primary))]" />
        <span className="text-[13px] font-semibold">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      <aside
        className={`fixed top-0 left-0 z-[70] h-full w-[88%] max-w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[rgb(var(--line))]">
          <Link
            to="/"
            onClick={close}
            className="font-extrabold tracking-tight text-lg"
          >
            CARSOPLAC
          </Link>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-9 h-9 grid place-items-center rounded-full hover:bg-[rgb(var(--neutral))] text-[rgb(var(--primary))] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3 border-b border-[rgb(var(--line))]">
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar productos..."
              className="input-base !h-11 !rounded-full !pl-11"
            />
          </form>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Promo chips */}
          <div className="px-5 pt-4 pb-2">
            <p className="eyebrow mb-3">Descubrir</p>
            <div className="grid grid-cols-3 gap-2">
              {promoLinks.map((p) => (
                <Link
                  key={p.label}
                  to={p.to}
                  onClick={close}
                  className="relative flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-[rgb(var(--neutral))] hover:bg-[rgb(var(--line))] transition text-center"
                >
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold bg-[rgb(var(--accent))] text-white px-1.5 py-0.5 rounded-full">
                    {p.tag}
                  </span>
                  <Sparkles size={16} className="text-[rgb(var(--primary))] mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    {p.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Categorías */}
          <nav className="px-5 py-3">
            <p className="eyebrow mb-2">Categorías</p>
            <div className="border-y border-[rgb(var(--line))] divide-y divide-[rgb(var(--line))]">
              {/* Inicio */}
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-3 py-3.5 cursor-pointer"
              >
                <span className="w-9 h-9 grid place-items-center rounded-full bg-[rgb(var(--neutral))]">
                  <HomeIcon size={16} className="text-[rgb(var(--primary))]" />
                </span>
                <span className="text-[15px] font-semibold flex-1">Inicio</span>
                <ArrowRight size={16} className="opacity-50" />
              </Link>

              {/* Productos con submenú */}
              <div>
                <button
                  onClick={() => setOpenProducts(!openProducts)}
                  className="w-full flex items-center gap-3 py-3.5 cursor-pointer"
                  aria-expanded={openProducts}
                >
                  <span className="w-9 h-9 grid place-items-center rounded-full bg-[rgb(var(--neutral))]">
                    <Tag size={16} className="text-[rgb(var(--primary))]" />
                  </span>
                  <span className="text-[15px] font-semibold flex-1 text-left">
                    Productos
                  </span>
                  <ChevronDown
                    size={18}
                    className={`opacity-60 transition-transform duration-300 ${
                      openProducts ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openProducts ? "max-h-96 pb-2" : "max-h-0"
                  }`}
                >
                  <ul className="pl-12 pr-2 space-y-1">
                    {categories.map((c) => (
                      <li key={c.name}>
                        <Link
                          to={c.to}
                          onClick={close}
                          className="flex items-center gap-2 py-2 text-[14px] text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))] transition"
                        >
                          <c.Icon size={14} />
                          {c.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        to="/productos"
                        onClick={close}
                        className="flex items-center gap-2 py-2 text-[13px] font-bold text-[rgb(var(--primary))]"
                      >
                        Ver todo el catálogo
                        <ArrowRight size={13} />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Otros (mezcla Links reales + placeholders) */}
              {navItems.map((it) => (
                <div key={it.to}>{renderItem(it, "row")}</div>
              ))}
            </div>
          </nav>

          {/* Mi cuenta (también con placeholders) */}
          <div className="px-5 py-4 border-t border-[rgb(var(--line))]">
            <p className="eyebrow mb-2">Mi cuenta</p>
            <div className="grid grid-cols-2 gap-2">
              {accountLinks.map((it) => renderItem(it, "chip"))}
            </div>
          </div>
        </div>

        {/* CTA WhatsApp */}
        <div className="px-5 py-5 border-t border-[rgb(var(--line))] space-y-2 bg-[rgb(var(--neutral))]">
          <p className="eyebrow">¿Necesitás asesoramiento?</p>
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary w-full !rounded-full"
          >
            Hablar por WhatsApp
          </a>
          <p className="text-[11px] text-[rgb(var(--muted))] text-center">
            Lun a Vie · 9 a 18 hs · Respuesta inmediata
          </p>
        </div>
      </aside>
    </>
  );
}
