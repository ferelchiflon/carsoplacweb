import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import type { Product, Category } from "../types";
import styles from "./Catalog.module.css";
import api from "../services/api";
import { useSearchParams } from "react-router-dom";

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState<string | number>("");
  const [maxPrice, setMaxPrice] = useState<string | number>("");
  const [brand, setBrand] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("newest");

  // Data for filters
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [brandsList, setBrandsList] = useState<string[]>([]);

  // Initialize filters from URL
  useEffect(() => {
    const params = Object.fromEntries(searchParams);
    setSearch(params.search || "");
    setCategory(params.category || "");
    setMinPrice(params.minPrice || "");
    setMaxPrice(params.maxPrice || "");
    setBrand(params.brand || "");
    setInStock(params.inStock === "true");
    setSort(params.sort || "newest");
    setPage(Number(params.page) || 1);
    setLimit(Number(params.limit) || 20);
  }, [searchParams]);

  // Fetch filters (categories, brands) when component mounts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/products/filters");
        if (cancelled) return;
        setCategoriesList(res.data.categories);
        setBrandsList(res.data.brands);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to load filters:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch products when filters or pagination change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/products", {
          params: {
            search,
            category,
            minPrice: minPrice === "" ? undefined : Number(minPrice),
            maxPrice: maxPrice === "" ? undefined : Number(maxPrice),
            brand,
            inStock: inStock ? true : undefined,
            sort,
            page,
            limit,
          },
        });
        if (cancelled) return;
        setProducts(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error al cargar productos"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    search,
    category,
    minPrice,
    maxPrice,
    brand,
    inStock,
    sort,
    page,
    limit,
  ]);

  // Update URL when filters change (except page)
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (search) newParams.set("search", search);
    if (category) newParams.set("category", category);
    if (minPrice !== "") newParams.set("minPrice", String(minPrice));
    if (maxPrice !== "") newParams.set("maxPrice", String(maxPrice));
    if (brand) newParams.set("brand", brand);
    if (inStock) newParams.set("inStock", "true");
    if (sort !== "newest") newParams.set("sort", sort);
    newParams.set("page", String(page));
    newParams.set("limit", String(limit));
    setSearchParams(newParams);
  }, [search, category, minPrice, maxPrice, brand, inStock, sort, page, limit, setSearchParams]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category, minPrice, maxPrice, brand, inStock, sort]);

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
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p className={styles.noProducts}>No encontramos productos con esos filtros.</p>
        )}
      </div>
      {/* Paginación */}
      <div className={styles.pagination}>
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={styles.paginationButton}
        >
          Anterior
        </button>
        <span className={styles.paginationInfo}>
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages || totalPages === 0}
          className={styles.paginationButton}
        >
          Siguiente
        </button>
        <div className={styles.paginationPageSize}>
          <label htmlFor="pageSize">Mostrar por página:</label>
          <select
            id="pageSize"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className={styles.pageSizeSelect}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
      <h1 className={styles.title}>VENTAS EFECTUADAS</h1>
    </div>
  );
}