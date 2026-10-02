import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import SectionHeader from "../components/ui/SectionHeader";
import FaqSection from "../components/ui/FaqSection";
import { API_URL } from "../config/api";
import { fetchWithTimeout, getFetchErrorMsg } from "../utils/fetchWithTimeout";

// ==================== TIPOS ====================
type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  images: string[];
  categoryId?: string | null;
  category?: Category | null;
};

type SortOption = "recent" | "price-asc" | "price-desc" | "name";

// ==================== COMPONENTE ====================
export default function ProductsPage() {
  // ===== ESTADOS =====
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // UI móvil
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();

  // ===== CARGA DE DATOS (reutilizable para el botón Reintentar) =====
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Con timeout: si el servidor cuelga la conexión (API dormida),
      // abortamos en 30s y mostramos error en vez de un spinner eterno.
      const [productsRes, categoriesRes] = await Promise.all([
        fetchWithTimeout(`${API_URL}/products`),
        // Las categorías son opcionales: si fallan, el catálogo igual funciona
        fetchWithTimeout(`${API_URL}/categories`).catch(() => null),
      ]);

      if (!productsRes.ok) {
        throw new Error(`Error del servidor (${productsRes.status})`);
      }

      const productsData = await productsRes.json();
      if (!Array.isArray(productsData)) {
        throw new Error("Formato de respuesta inválido");
      }

      let categoriesData: Category[] = [];
      if (categoriesRes && categoriesRes.ok) {
        const parsed = await categoriesRes.json();
        if (Array.isArray(parsed)) categoriesData = parsed;
      }

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(getFetchErrorMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ===== PRODUCTOS FILTRADOS =====
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filtro por categoría
    if (selectedCategory !== "all") {
      result = result.filter((product) => {
        const categoryId = product.category?.id ?? product.categoryId;
        return categoryId === selectedCategory;
      });
    }

    // Filtro por búsqueda
    if (search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por precio mínimo
    const min = minPrice ? parseFloat(minPrice) : null;
    if (min !== null && !isNaN(min) && min >= 0) {
      result = result.filter((product) => product.price >= min);
    }

    // Filtro por precio máximo
    const max = maxPrice ? parseFloat(maxPrice) : null;
    if (max !== null && !isNaN(max) && max >= 0) {
      result = result.filter((product) => product.price <= max);
    }

    // Validar que mínimo sea menor que máximo
    if (min !== null && max !== null && !isNaN(min) && !isNaN(max) && min > max) {
      // Si el mínimo es mayor que el máximo, no mostrar resultados
      return [];
    }

    // Ordenamiento
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
        break;
      case "recent":
      default:
        // Asumimos que el backend ya devuelve los productos ordenados por fecha
        break;
    }

    return result;
  }, [products, selectedCategory, search, minPrice, maxPrice, sortBy]);

  // ===== HANDLERS =====
  const clearFilters = () => {
    setSelectedCategory("all");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recent");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (search.trim()) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (sortBy !== "recent") count++;
    return count;
  }, [selectedCategory, search, minPrice, maxPrice, sortBy]);

  // ===== RENDER =====
  return (
    <div className="pb-8">
      {/* HEADER */}
      <div className="container-x pt-12 md:pt-20">
        <SectionHeader title="NUESTRO" subtitle="CATÁLOGO COMPLETO" />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="container-x mt-6">
        {/* Buscador y toggle de filtros */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-full border border-spruce-border bg-shaded-fern text-white placeholder:text-sage-gray text-sm focus:outline-none focus:border-accent-brand focus:ring-2 focus:ring-accent-brand transition"
            aria-label="Buscar productos"
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="px-4 py-2 rounded-full bg-pure-white text-midnight-forest text-sm font-bold relative hover:bg-pure-white/90 active:scale-95 transition-all"
            aria-label={filtersOpen ? "Cerrar filtros" : "Abrir filtros"}
            aria-expanded={filtersOpen}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 bg-accent-brand text-midnight-forest text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center"
                aria-label={`${activeFiltersCount} filtros activos`}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Panel de filtros */}
        {filtersOpen && (
          <div 
            className="bg-deep-lichen rounded-xl p-4 mb-4 border border-spruce-border anim-fade-up"
            role="region"
            aria-label="Filtros de productos"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">Filtros</h3>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-accent-brand font-semibold underline underline-offset-2 hover:no-underline transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* Categorías */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-white mb-2">Categoría</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedCategory === "all"
                      ? "bg-pure-white text-midnight-forest border-pure-white"
                      : "bg-transparent text-sage-gray border-spruce-border hover:bg-shaded-fern hover:text-white"
                  }`}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedCategory === category.id
                        ? "bg-pure-white text-midnight-forest border-pure-white"
                        : "bg-transparent text-sage-gray border-spruce-border hover:bg-shaded-fern hover:text-white"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Precio */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-white mb-2">Precio</p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-3 py-1.5 rounded-lg border border-spruce-border bg-shaded-fern text-white placeholder:text-sage-gray text-sm focus:outline-none focus:border-accent-brand focus:ring-2 focus:ring-accent-brand transition"
                  aria-label="Precio mínimo"
                  min="0"
                />
                <span className="text-sage-gray">-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-3 py-1.5 rounded-lg border border-spruce-border bg-shaded-fern text-white placeholder:text-sage-gray text-sm focus:outline-none focus:border-accent-brand focus:ring-2 focus:ring-accent-brand transition"
                  aria-label="Precio máximo"
                  min="0"
                />
              </div>
            </div>

            {/* Ordenamiento */}
            <div>
              <p className="text-sm font-semibold text-white mb-2">Ordenar por</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-1.5 rounded-lg border border-spruce-border bg-shaded-fern text-white text-sm focus:outline-none focus:border-accent-brand focus:ring-2 focus:ring-accent-brand transition"
                aria-label="Ordenar productos"
              >
                <option value="recent">Más recientes</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>
        )}

        {/* Estados de carga: skeletons con la misma grilla que el resultado */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-busy="true" aria-label="Cargando productos">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-deep-lichen rounded-xl border border-spruce-border overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-shaded-fern" />
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-2.5 w-1/3 rounded-full bg-shaded-fern" />
                  <div className="h-3.5 w-full rounded-full bg-shaded-fern" />
                  <div className="h-3.5 w-2/3 rounded-full bg-shaded-fern" />
                  <div className="h-5 w-1/2 rounded-full bg-shaded-fern mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado de error con botón Reintentar (recarga datos sin refrescar la página) */}
        {error && !loading && (
          <div
            className="rounded-xl border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-bg))] p-6 text-center"
            role="alert"
          >
            <p className="font-bold text-[rgb(var(--color-danger-text))]">No pudimos cargar el catálogo</p>
            <p className="text-sm text-[rgb(var(--color-danger-text))]/80 mt-1">{error}</p>
            <button
              type="button"
              onClick={load}
              className="btn btn-primary mt-4"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Lista de productos */}
        {!loading && !error && (
          <>
            <p className="mb-3 copy">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
              {activeFiltersCount > 0 && " encontrados"}
            </p>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="mb-4 copy">
                  No encontramos productos con esos filtros.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn btn-primary"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    img={product.images?.[0] || ""}
                    name={product.name}
                    provider={product.brand || "La Rosarina"}
                    category={product.category?.name ?? "General"}
                    price={`$${product.price.toFixed(2)}`}
                    onClick={() => navigate(`/productos/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* SECCIONES INFERIORES */}
      <FaqSection />
    </div>
  );
}