import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import type { Product, Category } from "../types";
import styles from "./ProductPage.module.css";
import api from "../services/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [resProducts, resCategories] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);
        if (cancelled) return;
        setProducts(resProducts.data);
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
  }, []);

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

      const created: Product = res.data;

      setProducts((prev) => [...prev, created]);

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

  async function handleEdit(product: Product) {
    const name = window.prompt("Nuevo nombre:", product.name);

    const price = window.prompt("Nuevo precio:", String(product.price));

    if (!name || !price) return;

    const updated = {
      name,
      price: Number(price),
    };

    try {
      await api.patch(`/products/${product.id}`, updated);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Error al editar");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar producto?")) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Error al eliminar");
    }
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
      <h1 className={styles.title}>LISTA DE PRODUCTOS</h1>
      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
      <h1 className={styles.title}>VENTAS EFECTUADAS</h1>
    </div>
  );
}