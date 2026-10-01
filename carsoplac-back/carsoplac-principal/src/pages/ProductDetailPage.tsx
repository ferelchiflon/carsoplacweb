import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_URL } from "../config/api";
import { fetchWithTimeout, getFetchErrorMsg } from "../utils/fetchWithTimeout";
import styles from "./ProductDetailPage.module.css";

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
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.center}>
        <h2 className="h1">Producto no encontrado</h2>
        <Link to="/productos" className={styles.backBtn}>
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
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to="/productos">Productos</Link>
        <span>/</span>
        <strong>{product.name}</strong>
      </div>

      <div className={styles.container}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {product.images?.[activeImage] ? (
              <img src={product.images[activeImage]} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>Sin imagen</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className={styles.thumbnails}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`${styles.thumb} ${
                    idx === activeImage ? styles.thumbActive : ""
                  }`}
                  onClick={() => setActiveImage(idx)}
                >
                  <img src={img} alt={`Vista ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.badge}>{categoryName}</span>
          <h1 className="h1">{product.name}</h1>
          <p className={styles.price}>${product.price.toLocaleString("es-AR")}</p>

          {product.stock !== undefined && (
            <p className={styles.stock}>
              {product.stock > 0 ? (
                <>
                  <span className={styles.dot} /> Stock disponible
                  {product.stock < 10 && ` (${product.stock} unidades)`}
                </>
              ) : (
                <span className={styles.outOfStock}>Sin stock</span>
              )}
            </p>
          )}

          {product.description && (
            <div className={styles.description}>
              <h2 className="h2">Descripción</h2>
              <p>{product.description}</p>
            </div>
          )}

          <div className={styles.quantityRow}>
            <label>Cantidad:</label>
            <div className={styles.qtyControls}>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Disminuir"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar"
              >
                +
              </button>
            </div>
          </div>

          <button
            className={`${styles.addBtn} ${added ? styles.added : ""}`}
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
          >
            {added
              ? "✓ Agregado al carrito"
              : adding
              ? "Agregando..."
              : "🛒 Agregar al carrito"}
          </button>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span>🚚</span>
              <div>
                <strong>Envío a domicilio</strong>
                <p>Coordinamos entrega en todo el país</p>
              </div>
            </div>
            <div className={styles.feature}>
              <span>💳</span>
              <div>
                <strong>Pago seguro</strong>
                <p>MercadoPago / Transferencia</p>
              </div>
            </div>
            <div className={styles.feature}>
              <span>🏭</span>
              <div>
                <strong>Directo de fábrica</strong>
                <p>Sin intermediarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
