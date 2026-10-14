import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Product, Category } from "../types";
import styles from "./ProductPage.module.css";
import api from "../services/api";

/**
 * Fila de la tabla de productos. Extiende Product con los campos que el
 * backend devuelve hoy (active, category) sin modificar el tipo compartido
 * (ProductCard y Catalog siguen consumiéndolo sin cambios).
 * Nota: el backend usa ObjectId (string) como id; el tipo compartido lo
 * declara como number por compatibilidad histórica con el resto del panel.
 */
type ProductRow = Product & {
  active?: boolean;
  category?: { id: string; name: string } | null;
};

/** Estilos compartidos de la tabla de productos y los modales (Bloque E). */
const thStyles: CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  fontWeight: 600,
  borderBottom: "2px solid #d0d0d0",
  whiteSpace: "nowrap",
};

const tdStyles: CSSProperties = {
  padding: "0.5rem 0.75rem",
  verticalAlign: "middle",
};

const overlayStyles: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "1rem",
};

/** Estados posibles de stock para insignias, colores y filtros (Bloque E). */
export type StockState = "out" | "low" | "ok";

/** Umbral de stock bajo (configurable). */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Normaliza el estado de stock de un producto.
 * Regla de la tarea: stock null o undefined se trata como 0 (sin stock),
 * SIN modificar los datos originales.
 */
export function buildStockState(
  stock: number | null | undefined,
): StockState {
  const value = stock ?? 0;
  if (value <= 0) return "out";
  if (value < LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

/** Devuelve el valor de stock tratando null/undefined como 0 (solo lectura). */
export function stockValue(stock: number | null | undefined): number {
  return stock ?? 0;
}


/** Normaliza un producto crudo del backend a ProductRow. */
function normalizeProduct(raw: any): ProductRow {
  return {
    ...raw,
    price: Number(raw?.price ?? 0),
    stock: raw?.stock ?? null,
    active: raw?.active ?? true,
    category: raw?.category ?? null,
  };
}

/** Acepta tanto un array directo como el wrapper { data, total, ... } del backend. */
function normalizeList(payload: any): ProductRow[] {
  const list = Array.isArray(payload) ? payload : payload?.data;
  return Array.isArray(list) ? list.map(normalizeProduct) : [];
}

/** Extrae un mensaje de error legible de una respuesta Axios/Nest (400/401/404/otros). */
function getApiError(err: any, fallback: string): string {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message;
  const detail = Array.isArray(msg)
    ? msg.join(" · ")
    : typeof msg === "string"
      ? msg
      : "";
  if (status === 401) {
    return detail || "Sesión expirada o no autorizada. Volvé a iniciar sesión.";
  }
  if (status === 404) {
    return detail || "El producto no existe (o ya fue eliminado).";
  }
  if (status === 400) {
    return detail || "Datos inválidos: revisá los campos e intentá de nuevo.";
  }
  return detail || err?.message || fallback;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImages, setNewImages] = useState<(File | null)[]>([null]);

  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Recarga de la lista: se incrementa para volver a pedir los productos.
  const [reloadKey, setReloadKey] = useState(0);

  // ── Edición (modal) ──
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    brand: "",
    price: "",
    stock: "",
    description: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Eliminación (modal de confirmación) ──
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [activeBusyId, setActiveBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Stock: banner, filtro y edición rápida ──
  const [stockFilter, setStockFilter] = useState<StockState | "all">("all");
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [stockBusyId, setStockBusyId] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<
    Record<string, { type: "ok" | "error"; message: string }>
  >({});

  const lowOrOutCount = products.filter(
    (p) => buildStockState(p.stock) !== "ok",
  ).length;
  const visibleProducts =
    stockFilter === "all"
      ? products
      : products.filter((p) => buildStockState(p.stock) === stockFilter);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [resProducts, resCategories] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);
        if (cancelled) return;
        setProducts(normalizeList(resProducts.data));
        setCategories(resCategories.data);
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Error al cargar datos";
        setError(typeof msg === "string" ? msg : "Error al cargar datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function handleAdd() {
    if (!newName || !newPrice) return;

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("name", newName);
      formData.append("price", newPrice);
      formData.append("stock", "1");
      if (newBrand) formData.append("brand", newBrand);
      if (newDescription) formData.append("description", newDescription);

      newImages.forEach((image) => {
        if (image) {
          formData.append("images", image);
        }
      });

      const res = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProducts((prev) => [...prev, normalizeProduct(res.data)]);

      setNewName("");
      setNewPrice("");
      setNewBrand("");
      setNewDescription("");
      setNewImages([null]);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Error al crear producto";
      alert(typeof msg === "string" ? msg : "Error al crear producto");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Constantes de validación en el frontend. Coinciden con el backend para
   * dar mensajes de error claros antes de subir (ahorra una request y
   * mejora la UX). NO son la única barrera: el backend revalida todo.
   */
  const ALLOWED_IMAGE_MIMETYPES: readonly string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  const MAX_IMAGE_SIZE_BYTES: number = 5 * 1024 * 1024;

  /**
   * Valida un archivo de imagen seleccionado por el usuario.
   * Devuelve `null` si es válido, o un mensaje de error en español.
   */
  function validateImageFile(file: File): string | null {
    if (!ALLOWED_IMAGE_MIMETYPES.includes(file.type)) {
      return `El archivo "${file.name}" no es una imagen válida. Solo se aceptan imágenes JPEG, PNG o WEBP.`;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `El archivo "${file.name}" (${sizeMb} MB) supera el tamaño máximo permitido de 5 MB.`;
    }
    return null;
  }

  function handleImageChange(index: number, file: File | null) {
    // Si el usuario canceló la selección, limpiamos el slot sin validar.
    if (!file) {
      const updated = [...newImages];
      updated[index] = null;
      setNewImages(updated);
      return;
    }

    // Validamos ANTES de aceptar el archivo. La validación visual del
    // atributo `accept="image/*"` es sólo una ayuda del navegador y es
    // trivialmente bypaseable; acá está la barrera real.
    const validationError = validateImageFile(file);
    if (validationError) {
      alert(validationError);
      // Limpiamos el input del DOM para que el usuario pueda reintentar
      // con el mismo control sin tener que recargar.
      const input = document.querySelectorAll<HTMLInputElement>(
        `.${styles.imageInput}`,
      )[index];
      if (input) input.value = "";
      return;
    }

    const updated = [...newImages];

    updated[index] = file;

    const isLastInput = index === newImages.length - 1;

    if (file && isLastInput) {
      updated.push(null);
    }

    setNewImages(updated);
  }

  /** Abre el modal de edición con los datos precargados del producto. */
  function openEdit(product: ProductRow) {
    setEditing(product);
    setEditForm({
      name: product.name ?? "",
      brand: product.brand ?? "",
      price: String(product.price ?? ""),
      stock:
        product.stock === null || product.stock === undefined
          ? ""
          : String(product.stock),
      description: product.description ?? "",
    });
    setEditError(null);
  }

  function closeEdit() {
    if (savingEdit) return;
    setEditing(null);
    setEditError(null);
  }

  /**
   * Guarda la edición con PATCH /products/:id enviando SOLO los campos
   * modificados (el backend acepta name, brand, price, stock y description).
   * Las imágenes no se pueden cambiar por PATCH (el endpoint es solo JSON):
   * se muestran las existentes en modo lectura.
   */
  async function saveEdit() {
    if (!editing || savingEdit) return;

    const payload: Record<string, unknown> = {};
    if (editForm.name.trim() !== (editing.name ?? "")) {
      payload.name = editForm.name.trim();
    }
    if (editForm.brand.trim() !== (editing.brand ?? "")) {
      payload.brand = editForm.brand.trim();
    }
    const priceNum = Number(editForm.price);
    if (
      editForm.price !== "" &&
      Number.isFinite(priceNum) &&
      priceNum !== Number(editing.price)
    ) {
      payload.price = priceNum;
    }
    const stockNum = Number(editForm.stock);
    if (
      editForm.stock !== "" &&
      Number.isInteger(stockNum) &&
      stockNum >= 0 &&
      stockNum !== Number(editing.stock ?? 0)
    ) {
      payload.stock = stockNum;
    }
    if (editForm.description !== (editing.description ?? "")) {
      payload.description = editForm.description;
    }

    // Sin cambios no se dispara ninguna petición.
    if (Object.keys(payload).length === 0) {
      setEditing(null);
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await api.patch(`/products/${editing.id}`, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? normalizeProduct(res.data) : p)),
      );
      setEditing(null);
    } catch (err: any) {
      setEditError(getApiError(err, "Error al guardar los cambios"));
    } finally {
      setSavingEdit(false);
    }
  }

  /** Confirma la eliminación y recarga la lista completa desde el backend. */
  async function confirmDelete() {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/products/${deleting.id}`);
      setDeleting(null);
      setReloadKey((k) => k + 1); // dispara la recarga de la lista
    } catch (err: any) {
      setDeleteError(getApiError(err, "Error al eliminar el producto"));
    } finally {
      setDeletingBusy(false);
    }
  }

  /**
   * Activa/desactiva un producto con PATCH /products/:id enviando solo
   * { active }. Deshabilitado por fila mientras hay una petición en vuelo
   * (activeBusyId) para evitar dobles clics.
   */
  async function toggleActive(product: ProductRow) {
    if (activeBusyId) return;
    setActiveBusyId(product.id);
    setActionError(null);
    try {
      const res = await api.patch(`/products/${product.id}`, {
        active: !product.active,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? normalizeProduct(res.data) : p)),
      );
    } catch (err: any) {
      setActionError(getApiError(err, "Error al cambiar el estado del producto"));
    } finally {
      setActiveBusyId(null);
    }
  }

  /**
   * Edición rápida de stock: PATCH /products/:id enviando SOLO { stock }.
   * Se confirma con el botón "Guardar" o con Enter (NUNCA en onBlur).
   * En error se restaura el valor anterior; en éxito se actualiza la fila
   * (insignia y banner incluidos) sin recargar toda la página.
   */
  async function saveStock(product: ProductRow) {
    const key = String(product.id);
    const draft = stockDrafts[key];
    const current = String(stockValue(product.stock));
    if (draft === undefined || draft === current || stockBusyId !== null) return;

    // Validación en el frontend: entero >= 0 (el backend revalida).
    const parsed = Number(draft);
    if (draft === "" || !Number.isInteger(parsed) || parsed < 0) {
      setStockStatus((s) => ({
        ...s,
        [key]: { type: "error", message: "El stock debe ser un entero mayor o igual a 0" },
      }));
      return;
    }

    setStockBusyId(key);
    setStockStatus((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
    try {
      const res = await api.patch(`/products/${product.id}`, { stock: parsed });
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === key ? normalizeProduct(res.data) : p)),
      );
      setStockDrafts((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      setStockStatus((s) => ({
        ...s,
        [key]: { type: "ok", message: "Stock actualizado" },
      }));
    } catch (err: any) {
      // Restaurar el valor anterior: descartamos el borrador de la fila.
      setStockDrafts((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      setStockStatus((s) => ({
        ...s,
        [key]: { type: "error", message: getApiError(err, "Error al actualizar el stock") },
      }));
    } finally {
      setStockBusyId(null);
    }
  }

  /** Abre el modal de edición (usado por la acción "Editar" de cada fila). */
  function handleEdit(product: ProductRow) {
    openEdit(product);
  }

  /** Abre el modal de confirmación de eliminación de una fila. */
  function handleDelete(product: ProductRow) {
    setActionError(null);
    setDeleting(product);
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setSubmittingCategory(true);
    try {
      const res = await api.post("/categories", { name: newCategory });
      const created: Category = res.data;
      setCategories((prev) => [...prev, created]);
      setNewCategory("");
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Error al crear");
    } finally {
      setSubmittingCategory(false);
    }
  }

  if (loading)
    return (
      <div className={styles.page}>
        <p>Cargando productos...</p>
      </div>
    );
  if (error)
    return (
      <div className={styles.page}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <p style={{ fontSize: "0.85em", color: "#666" }}>
          Verificá que el backend (NestJS) esté corriendo en localhost:3000.
        </p>
      </div>
    );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>AGREGAR NUEVO PRODUCTO</h1>
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Marca</label>
            <input
              className={styles.input}
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Precio</label>
            <input
              className={`${styles.input} ${styles.priceInput}`}
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>

          <div className={styles.imagesContainer}>
            {newImages.map((_, index) => (
              <div key={index} className={styles.imageField}>
                <input
                  className={`${styles.input} ${styles.imageInput}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(index, e.target.files?.[0] ?? null)
                  }
                />
              </div>
            ))}
          </div>

          <button
            className={styles.submitBtn}
            onClick={handleAdd}
            disabled={submitting}
          >
            {submitting ? "Subiendo..." : "Agregar"}
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.descriptionField}>
            <label className={styles.label}>Descripción</label>
            <textarea
              className={styles.textarea}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className={styles.categorySection}>
        <h1 className={styles.title}>CATEGORÍAS</h1>

        <div className={styles.categoryForm}>
          <div className={styles.field}>
            <label className={styles.label}>Nueva categoría</label>
            <input
              className={styles.input}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ej: Herramientas"
            />
          </div>
          <button
            className={styles.submitBtn}
            onClick={handleAddCategory}
            disabled={submittingCategory}
          >
            {submittingCategory ? "Creando..." : "Crear"}
          </button>
        </div>

        <div className={styles.categoryList}>
          {categories.map((cat) => (
            <span key={cat.id} className={styles.categoryChip}>
              {cat.name}
            </span>
          ))}
        </div>
      </div>
      {/* ─────────────── LISTADO DE PRODUCTOS ─────────────── */}
      <section className={styles.sectionHeader} style={{ marginTop: "2.5rem" }}>
        <h2 className={styles.sectionTitle}>PRODUCTOS</h2>
      </section>

      {actionError && (
        <p role="alert" style={{ color: "red", margin: "0.75rem 0" }}>
          {actionError}
        </p>
      )}

      {/* ─────────────── BANNER DE STOCK BAJO + FILTRO ─────────────── */}
      {products.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0.75rem 0",
            padding: "0.6rem 0.9rem",
            border: "1px solid #e2e2e2",
            borderRadius: 8,
            background: lowOrOutCount > 0 ? "#fff8e1" : "#fafafa",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: lowOrOutCount > 0 ? "#7a5b00" : "#555",
            }}
          >
            {lowOrOutCount > 0
              ? `⚠ ${lowOrOutCount} ${
                  lowOrOutCount === 1 ? "producto" : "productos"
                } con stock bajo (menos de ${LOW_STOCK_THRESHOLD} unidades, incluye sin stock)`
              : "Todo el stock está en niveles normales"}
          </span>
          <label style={{ fontSize: "0.85rem" }}>
            Filtrar por stock:{" "}
            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(e.target.value as StockState | "all")
              }
            >
              <option value="all">Todos</option>
              <option value="low">Stock bajo</option>
              <option value="out">Sin stock</option>
            </select>
          </label>
        </div>
      )}

      {products.length === 0 ? (
        <p className={styles.emptyStateText}>No hay productos cargados.</p>
      ) : visibleProducts.length === 0 ? (
        <p className={styles.emptyStateText}>
          No hay productos que coincidan con el filtro de stock.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
              color: "#222",
            }}
          >
            <thead>
              <tr>
                <th style={thStyles}>Imagen</th>
                <th style={thStyles}>Nombre</th>
                <th style={thStyles}>Categoría</th>
                <th style={thStyles}>Precio</th>
                <th style={thStyles}>Stock</th>
                <th style={thStyles}>Estado</th>
                <th style={thStyles}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => {
                const stockState = buildStockState(p.stock);
                const rowKey = String(p.id);
                const currentStock = String(stockValue(p.stock));
                const draft = stockDrafts[rowKey];
                const stockChanged = draft !== undefined && draft !== currentStock;
                const parsedStock = Number(draft);
                const canSaveStock =
                  stockChanged &&
                  draft !== "" &&
                  Number.isInteger(parsedStock) &&
                  parsedStock >= 0;
                return (
                <tr key={p.id} style={{ borderTop: "1px solid #e2e2e2" }}>
                  <td style={tdStyles}>
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        width={44}
                        height={44}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "cover",
                          borderRadius: 6,
                          display: "block",
                        }}
                      />
                    ) : (
                      <span aria-hidden>—</span>
                    )}
                  </td>
                  <td style={tdStyles}>{p.name}</td>
                  <td style={tdStyles}>{p.category?.name ?? "—"}</td>
                  <td style={tdStyles}>${p.price}</td>
                  <td style={tdStyles}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.35rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: stockState === "ok" ? "#222" : "#b3261e",
                          }}
                        >
                          {stockValue(p.stock)}
                        </span>
                        {stockState === "low" && (
                          <span
                            style={{
                              background: "#fdecea",
                              color: "#b3261e",
                              borderRadius: 999,
                              padding: "0.1rem 0.5rem",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Stock bajo
                          </span>
                        )}
                        {stockState === "out" && (
                          <span
                            style={{
                              background: "#b3261e",
                              color: "#fff",
                              borderRadius: 999,
                              padding: "0.1rem 0.5rem",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Sin stock
                          </span>
                        )}
                      </div>
                      {/* Edición rápida de stock: se confirma con "Guardar"
                          o con Enter. NUNCA se guarda en onBlur. */}
                      <div
                        style={{
                          display: "flex",
                          gap: "0.25rem",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          aria-label={`Stock de ${p.name}`}
                          value={draft ?? currentStock}
                          disabled={stockBusyId !== null}
                          onChange={(e) => {
                            const value = e.target.value;
                            setStockDrafts((d) => ({ ...d, [rowKey]: value }));
                            setStockStatus((s) => {
                              const next = { ...s };
                              delete next[rowKey];
                              return next;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && canSaveStock) {
                              e.preventDefault();
                              saveStock(p);
                            }
                          }}
                          style={{
                            width: 72,
                            padding: "0.2rem 0.4rem",
                            border: "1px solid #d0d0d0",
                            borderRadius: 6,
                          }}
                        />
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => saveStock(p)}
                          disabled={!canSaveStock || stockBusyId !== null}
                          style={{
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {stockBusyId === rowKey ? "..." : "Guardar"}
                        </button>
                      </div>
                      {stockStatus[rowKey] && (
                        <span
                          role={
                            stockStatus[rowKey].type === "error"
                              ? "alert"
                              : "status"
                          }
                          style={{
                            fontSize: "0.72rem",
                            color:
                              stockStatus[rowKey].type === "error"
                                ? "#b3261e"
                                : "#1a7f37",
                          }}
                        >
                          {stockStatus[rowKey].type === "error"
                            ? stockStatus[rowKey].message
                            : `✓ ${stockStatus[rowKey].message}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={tdStyles}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        cursor: activeBusyId ? "wait" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        role="switch"
                        checked={p.active}
                        disabled={activeBusyId !== null}
                        onChange={() => toggleActive(p)}
                        aria-label={
                          p.active ? `Desactivar ${p.name}` : `Activar ${p.name}`
                        }
                      />
                      <span
                        style={{
                          color: p.active ? "#1a7f37" : "#888",
                          fontWeight: 600,
                        }}
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </span>
                    </label>
                  </td>
                  <td style={tdStyles}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => handleEdit(p)}
                        disabled={activeBusyId !== null}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => handleDelete(p)}
                        disabled={activeBusyId !== null}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────── MODAL: EDITAR PRODUCTO ─────────────── */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          style={overlayStyles}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEdit) closeEdit();
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "1.5rem",
              maxWidth: 480,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 id="edit-modal-title" style={{ marginTop: 0 }}>
              Editar producto
            </h3>

            {/* PATCH /products/:id es solo JSON: no acepta archivos. Las
                imágenes existentes se muestran en modo lectura. */}
            {editing.images.length > 0 ? (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>
                  Imágenes actuales
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {editing.images.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt={`Imagen actual de ${editing.name}`}
                      width={64}
                      height={64}
                      loading="lazy"
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ))}
                </div>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.8em", color: "#777" }}>
                  Las imágenes no se pueden cambiar desde acá: la edición por
                  PATCH solo acepta datos (JSON).
                </p>
              </div>
            ) : (
              <p style={{ margin: "0 0 1rem", fontSize: "0.85em", color: "#777" }}>
                Este producto no tiene imágenes cargadas.
              </p>
            )}

            <div className={styles.field} style={{ marginBottom: "0.75rem" }}>
              <label className={styles.label} htmlFor="edit-name">
                Nombre
              </label>
              <input
                id="edit-name"
                className={styles.input}
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className={styles.field} style={{ marginBottom: "0.75rem" }}>
              <label className={styles.label} htmlFor="edit-brand">
                Marca
              </label>
              <input
                id="edit-brand"
                className={styles.input}
                type="text"
                value={editForm.brand}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, brand: e.target.value }))
                }
              />
            </div>

            <div className={styles.field} style={{ marginBottom: "0.75rem" }}>
              <label className={styles.label} htmlFor="edit-price">
                Precio
              </label>
              <input
                id="edit-price"
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </div>

            <div className={styles.field} style={{ marginBottom: "0.75rem" }}>
              <label className={styles.label} htmlFor="edit-stock">
                Stock
              </label>
              <input
                id="edit-stock"
                className={styles.input}
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={editForm.stock}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, stock: e.target.value }))
                }
              />
            </div>

            <div className={styles.field} style={{ marginBottom: "0.75rem" }}>
              <label className={styles.label} htmlFor="edit-description">
                Descripción
              </label>
              <textarea
                id="edit-description"
                className={styles.textarea}
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {editError && (
              <p role="alert" style={{ color: "red", margin: "0.5rem 0" }}>
                {editError}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={closeEdit}
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={saveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─────────────── MODAL: CONFIRMAR ELIMINACIÓN ─────────────── */}
      {deleting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={overlayStyles}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingBusy) setDeleting(null);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "1.5rem",
              maxWidth: 420,
              width: "100%",
            }}
          >
            <h3 id="delete-modal-title" style={{ marginTop: 0 }}>
              Eliminar producto
            </h3>
            <p>
              ¿Seguro que querés eliminar <strong>{deleting.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <p role="alert" style={{ color: "red", margin: "0.5rem 0" }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setDeleting(null)}
                disabled={deletingBusy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={confirmDelete}
                disabled={deletingBusy}
              >
                {deletingBusy ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className={styles.title}>VENTAS EFECTUADAS</h1>
    </div>
  );
}