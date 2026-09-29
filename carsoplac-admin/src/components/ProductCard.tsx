import type { Product } from "../types";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
};

export default function ProductCard({ product, onEdit, onDelete }: Props) {
  const firstImage =
    product.images?.length
      ? product.images[0]
      : null;

  return (
    <div className={styles.card}>
      {/* Status dot */}
      <div className={styles.statusDot} title="Activo" />

      {/* Name + thumbnail */}
      <div className={styles.info}>
        {firstImage ? (
          <img src={firstImage} alt={product.name} className={styles.thumbnail} />
        ) : (
          <div className={styles.noImage}>IMG</div>
        )}
        <div className={styles.nameGroup}>
          <h3 className={styles.name}>{product.name}</h3>
          <span className={styles.brand}>{product.brand || "Sin marca"}</span>
        </div>
      </div>

      {/* Price */}
      <div className={styles.price}>
        ${Number(product.price).toFixed(2)}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.editBtn} onClick={() => onEdit(product)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button className={styles.deleteBtn} onClick={() => onDelete(product.id)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Eliminar
        </button>
      </div>
    </div>
  );
}