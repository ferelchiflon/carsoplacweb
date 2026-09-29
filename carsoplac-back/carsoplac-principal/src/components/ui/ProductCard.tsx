// src/components/ui/ProductCard.tsx

import { useCart } from "../../context/CartContext";
import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Heart, Eye, ShoppingBag, Check, X } from "lucide-react";

type ProductCardProps = {
  id: string;
  img: string;
  name: string;
  provider: string;
  category: string;
  price: string;
  onClick?: () => void;
  badge?: string;        // "NUEVO" | "OFERTA" | "-15%"
  oldPrice?: string;
  installments?: number;
};

function parsePrice(raw: string): number {
  const clean = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ProductCard(props: ProductCardProps) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  const [fav, setFav] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const { setOpenCart } = useOutletContext<{
    setOpenCart: (v: boolean) => void;
  }>();

  const priceNum = parsePrice(props.price);
  const oldPriceNum = props.oldPrice ? parsePrice(props.oldPrice) : 0;
  const discount =
    oldPriceNum > priceNum && priceNum > 0
      ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
      : 0;

  const cleanToast = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowToast(false);
  };

  useEffect(() => () => cleanToast(), []);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: props.id,
      name: props.name,
      price: priceNum,
      image: props.img,
      quantity: 1,
    });
    setShowToast(true);
    cleanToast();
    timeoutRef.current = window.setTimeout(() => setShowToast(false), 6000);
  };

  return (
    <article className="group relative flex flex-col w-full bg-white rounded-2xl overflow-hidden border border-[rgb(var(--line))] hover:border-[rgb(var(--primary))] hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <button
        onClick={props.onClick}
        className="relative w-full aspect-square bg-[rgb(var(--neutral))] overflow-hidden block cursor-pointer"
        aria-label={`Ver ${props.name}`}
      >
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {props.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[rgb(var(--accent))] text-white text-[10px] font-extrabold uppercase tracking-wide shadow">
              {props.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[rgb(var(--primary))] text-white text-[10px] font-extrabold uppercase tracking-wide shadow">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick actions: siempre visibles en mobile, hover en desktop */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFav((v) => !v);
            }}
            aria-label="Favorito"
            aria-pressed={fav}
            className={`w-9 h-9 grid place-items-center rounded-full bg-white shadow hover:bg-[rgb(var(--neutral))] transition ${
              fav ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--primary))]"
            }`}
          >
            <Heart size={16} fill={fav ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onClick?.();
            }}
            aria-label="Vista rápida"
            className="w-9 h-9 grid place-items-center rounded-full bg-white shadow hover:bg-[rgb(var(--neutral))] text-[rgb(var(--primary))] transition"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Image (object-contain mantiene la proporción real dentro del aspect-square) */}
        <img
          src={props.img}
          alt={props.name}
          loading="lazy"
          onError={(e) => {
            const t = e.currentTarget as HTMLImageElement;
            if (t.dataset.fallback === "1") return;
            t.dataset.fallback = "1";
            t.onerror = null;
            t.src =
              "data:image/svg+xml;utf8," +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>'
              );
          }}
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />

        {/* Quick-add overlay (hover desktop) */}
        <div className="hidden md:flex absolute inset-x-3 bottom-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleAdd}
            className="w-full h-10 rounded-full bg-[rgb(var(--primary))] text-white text-xs font-bold uppercase tracking-wide hover:bg-[rgb(var(--accent))] active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={14} />
            Agregar al carrito
          </button>
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3">
        <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] font-semibold mb-1">
          {props.category}
        </span>
        <h3
          onClick={props.onClick}
          className="text-sm font-bold leading-snug text-[rgb(var(--primary))] line-clamp-2 cursor-pointer transition-colors duration-200 group-hover:text-[rgb(var(--accent))] hover:underline"
        >
          {props.name}
        </h3>
        <p className="text-[11px] text-[rgb(var(--muted))] mt-0.5 truncate">
          {props.provider}
        </p>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-[rgb(var(--primary))]">
            {formatARS(priceNum)}
          </span>
          {oldPriceNum > priceNum && priceNum > 0 && (
            <span className="text-xs text-[rgb(var(--muted))] line-through">
              {formatARS(oldPriceNum)}
            </span>
          )}
        </div>
        {(props.installments ?? 12) > 1 && priceNum > 0 && (
          <p className="text-[11px] text-[rgb(var(--muted))] mt-0.5">
            o hasta{" "}
            <span className="font-semibold text-[rgb(var(--primary))]">
              {props.installments ?? 12} cuotas sin interés
            </span>{" "}
            de {formatARS(priceNum / (props.installments ?? 12))}
          </p>
        )}

        {/* CTA móvil */}
        <button
          onClick={handleAdd}
          className="md:hidden mt-3 w-full h-10 rounded-full bg-[rgb(var(--primary))] text-white text-xs font-bold uppercase tracking-wide active:scale-95 transition flex items-center justify-center gap-1.5"
        >
          <ShoppingBag size={14} />
          Agregar
        </button>
      </div>

      {/* Toast confirmación */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 pointer-events-none">
          <div className="pointer-events-auto bg-[rgb(var(--primary))] text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <span className="w-9 h-9 grid place-items-center rounded-full bg-white/15 shrink-0">
              <Check size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">¡Producto agregado!</p>
              <p className="text-xs opacity-80 truncate">{props.name}</p>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => {
                    cleanToast();
                    setOpenCart(true);
                  }}
                  className="text-xs font-bold underline underline-offset-2"
                >
                  Ver carrito
                </button>
                <button
                  onClick={cleanToast}
                  className="text-xs opacity-80 hover:opacity-100"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
            <button
              onClick={cleanToast}
              aria-label="Cerrar"
              className="opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
