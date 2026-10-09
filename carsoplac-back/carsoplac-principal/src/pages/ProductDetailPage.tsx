import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { Heart, MessageCircle } from "lucide-react";
import { API_URL } from "../config/api";
import { fetchWithTimeout, getFetchErrorMsg } from "../utils/fetchWithTimeout";
import { WHATSAPP_CONFIG } from "../config/whatsapp";

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  brand?: string;
  description?: string;
  category?: { name: string } | string;
  stock?: number;
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = product ? isFavorite(product.id) : false;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchWithTimeout(`${API_URL}/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch((err) => setError(getFetchErrorMsg(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    setAdding(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      quantity,
    });
    setAdded(true);
    setTimeout(() => {
      setAdding(false);
      setAdded(false);
    }, 1800);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center text-white">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-spruce-border border-t-accent-brand" />
        <p className="copy">Cargando producto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center text-white">
        <h2 className="h1">Producto no encontrado</h2>
        <Link to="/productos" className="btn btn-primary">
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : (product.category ?? "General");

  return (
    <div className="container-x py-4 pb-12">
      <nav
        aria-label="Navegación de migas"
        className="mb-6 flex flex-wrap items-center gap-2 text-sm text-sage-gray"
      >
        <Link to="/" className="transition-colors hover:text-pure-white hover:underline">
          Inicio
        </Link>
        <span aria-hidden>/</span>
        <Link to="/productos" className="transition-colors hover:text-pure-white hover:underline">
          Productos
        </Link>
        <span aria-hidden>/</span>
        <strong className="break-words font-semibold text-pure-white">{product.name}</strong>
      </nav>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-spruce-border bg-deep-lichen">
            {product.images?.[activeImage] ? (
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-sm text-sage-gray">Sin imagen</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex flex-wrap gap-2.5">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Ver imagen ${idx + 1}`}
                  aria-pressed={idx === activeImage}
                  className={`h-14 w-14 overflow-hidden rounded-xl border-2 bg-deep-lichen transition-colors sm:h-[70px] sm:w-[70px] ${
                    idx === activeImage ? "border-accent-brand" : "border-transparent"
                  }`}
                  onClick={() => setActiveImage(idx)}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card flex min-w-0 flex-col gap-4 p-6">
          <span className="chip chip-new w-fit">{categoryName}</span>
          <h1 className="h1 break-words">{product.name}</h1>
          <p className="text-[1.75rem] font-medium leading-none text-pure-white">
            ${product.price.toLocaleString("es-AR")}
          </p>

          {product.stock !== undefined && (
            <p className="flex items-center gap-2 text-sm text-sage-gray">
              {product.stock > 0 ? (
                <>
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[rgb(var(--color-success-text))]" />
                  Stock disponible
                  {product.stock < 10 && ` (${product.stock} unidades)`}
                </>
              ) : (
                <span className="font-semibold text-[rgb(var(--color-danger-text))]">Sin stock</span>
              )}
            </p>
          )}

          {product.description && (
            <div className="border-t border-spruce-border pt-4">
              <h2 className="h2">Descripción</h2>
              <p className="copy mt-2 whitespace-pre-line break-words">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-semibold text-pure-white">Cantidad:</label>
            <div className="flex items-center gap-3 rounded-lg border border-spruce-border bg-deep-lichen px-2 py-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-mossy-edge text-lg text-pure-white transition-colors hover:bg-mist-gray hover:text-midnight-forest"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="min-w-[28px] text-center font-semibold text-pure-white">
                {quantity}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-mossy-edge text-lg text-pure-white transition-colors hover:bg-mist-gray hover:text-midnight-forest"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className={`btn btn-primary flex-1 ${
                added ? "!bg-accent-brand !text-midnight-forest" : ""
              }`}
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {added
                ? "✓ Agregado al carrito"
                : adding
                ? "Agregando..."
                : "🛒 Agregar al carrito"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!product) return;
                toggleFavorite({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  images: product.images,
                });
              }}
              aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
              title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
              className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${
                isFav
                  ? "bg-midnight-forest border-accent-brand text-accent-brand"
                  : "bg-deep-lichen border-spruce-border text-white hover:border-accent-brand/50"
              }`}
            >
              <Heart size={20} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Botón directo de consulta rápida por WhatsApp para este producto */}
          <a
            href={`https://wa.me/${WHATSAPP_CONFIG.phoneNumberRaw}?text=${encodeURIComponent(
              WHATSAPP_CONFIG.productMessage(product.name, window.location.href)
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-midnight-forest font-semibold text-xs tracking-wide transition-all"
          >
            <MessageCircle size={16} />
            Consultar stock / presupuesto por WhatsApp
          </a>

          <div className="mt-2 flex flex-col gap-3 border-t border-spruce-border pt-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">🚚</span>
              <div>
                <strong className="mb-0.5 block text-sm font-semibold text-pure-white">
                  Envío a domicilio
                </strong>
                <p className="text-xs text-sage-gray">Coordinamos entrega en todo el país</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">💳</span>
              <div>
                <strong className="mb-0.5 block text-sm font-semibold text-pure-white">
                  Pago seguro
                </strong>
                <p className="text-xs text-sage-gray">MercadoPago / Transferencia</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">🏭</span>
              <div>
                <strong className="mb-0.5 block text-sm font-semibold text-pure-white">
                  Directo de fábrica
                </strong>
                <p className="text-xs text-sage-gray">Sin intermediarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
