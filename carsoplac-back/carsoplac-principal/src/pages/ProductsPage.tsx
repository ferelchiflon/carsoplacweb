// src/pages/ProductsPage.tsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ui/ProductCard";
import SectionHeader from "../components/ui/SectionHeader";
import FaqSection from "../components/ui/FaqSection";
import FilterPanel from "../components/ui/FilterPanel";
import { API_URL } from "../config/api";
import { fetchWithTimeout, getFetchErrorMsg } from "../utils/fetchWithTimeout";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  PackageOpen,
} from "lucide-react";

export type Category = {
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
  stock?: number;
};

type PaginatedResponse = {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros sincronizados con URL query params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || searchParams.get("cat") || "all"
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [brand, setBrand] = useState(searchParams.get("brand") || "all");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const limit = 12; // 12 productos por página para grilla perfecta (2, 3 o 4 cols)

  // Mobile Drawer
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce para búsqueda por texto
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reiniciar a página 1 al buscar
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sincronizar parámetros en URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategory !== "all") params.category = selectedCategory;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (brand !== "all") params.brand = brand;
    if (inStock) params.inStock = "true";
    if (sortBy !== "newest") params.sort = sortBy;
    if (page > 1) params.page = String(page);

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    selectedCategory,
    minPrice,
    maxPrice,
    brand,
    inStock,
    sortBy,
    page,
    setSearchParams,
  ]);

  // Cargar metadatos de filtros (categorías y marcas)
  useEffect(() => {
    fetchWithTimeout(`${API_URL}/products/filters`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
          if (Array.isArray(data.brands)) {
            setBrands(data.brands);
          }
        }
      })
      .catch((err) => console.error("Error cargando filtros:", err));
  }, []);

  // Cargar productos desde el endpoint paginado y filtrado en servidor
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const query = new URLSearchParams();
    if (debouncedSearch.trim()) query.set("search", debouncedSearch.trim());
    if (selectedCategory !== "all") query.set("category", selectedCategory);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);
    if (brand !== "all") query.set("brand", brand);
    if (inStock) query.set("inStock", "true");
    if (sortBy) query.set("sort", sortBy);
    query.set("page", String(page));
    query.set("limit", String(limit));

    try {
      const res = await fetchWithTimeout(`${API_URL}/products?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}: no se pudieron cargar los productos`);
      }

      const json: PaginatedResponse = await res.json();
      if (Array.isArray(json?.data)) {
        setProducts(json.data);
        setTotalProducts(json.total || json.data.length);
        setTotalPages(json.totalPages || 1);
      } else if (Array.isArray(json)) {
        // Fallback por si la respuesta fuera array plano
        setProducts(json);
        setTotalProducts((json as Product[]).length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError(getFetchErrorMsg(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, brand, inStock, sortBy, page]);

  useEffect(() => {
    loadProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [loadProducts]);

  const activeFiltersCount = [
    selectedCategory !== "all",
    minPrice !== "",
    maxPrice !== "",
    brand !== "all",
    inStock,
    sortBy !== "newest",
  ].filter(Boolean).length;

  const handleClearAll = () => {
    setSelectedCategory("all");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setBrand("all");
    setInStock(false);
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-midnight-forest text-white pb-16">
      {/* HEADER */}
      <div className="container-x pt-12 md:pt-16">
        <SectionHeader title="DIRECTO DE FÁBRICA" subtitle="NUESTRO CATÁLOGO" />
      </div>

      <div className="container-x mt-6">
        {/* BARRA SUPERIOR: BUSCADOR + TOGGLE MOBILE + RESUMEN */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-deep-lichen border border-spruce-border rounded-2xl p-3 md:p-4 shadow-subtle">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-gray" />
            <input
              type="text"
              placeholder="Buscar por placa, baldosón, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-spruce-border bg-shaded-fern text-white placeholder:text-sage-gray text-xs focus:outline-none focus:border-accent-brand transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-gray hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-sage-gray">
              {loading ? (
                "Buscando…"
              ) : (
                <>
                  <strong className="text-white font-semibold">{totalProducts}</strong> productos
                </>
              )}
            </span>

            {/* Botón Filtros Mobile */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-shaded-fern border border-spruce-border text-xs font-semibold hover:border-accent-brand transition cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-accent-brand" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-accent-brand text-midnight-forest text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* LAYOUT: SIDEBAR DESKTOP + GRILLA DE PRODUCTOS */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR DESKTOP (fijo y sticky) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterPanel
                selectedCategory={selectedCategory}
                setSelectedCategory={(cat) => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                search={search}
                setSearch={setSearch}
                minPrice={minPrice}
                setMinPrice={(v) => {
                  setMinPrice(v);
                  setPage(1);
                }}
                maxPrice={maxPrice}
                setMaxPrice={(v) => {
                  setMaxPrice(v);
                  setPage(1);
                }}
                brand={brand}
                setBrand={(b) => {
                  setBrand(b);
                  setPage(1);
                }}
                inStock={inStock}
                setInStock={(s) => {
                  setInStock(s);
                  setPage(1);
                }}
                sortBy={sortBy}
                setSortBy={(s) => {
                  setSortBy(s);
                  setPage(1);
                }}
                categories={categories}
                brands={brands}
              />
            </div>
          </aside>

          {/* ÁREA PRINCIPAL DE CONTENIDO */}
          <main className="flex-1 min-w-0">
            {/* ESTADO CARGANDO */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-deep-lichen rounded-xl border border-spruce-border overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-shaded-fern" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-2.5 w-1/3 rounded-full bg-shaded-fern" />
                      <div className="h-3.5 w-full rounded-full bg-shaded-fern" />
                      <div className="h-3.5 w-2/3 rounded-full bg-shaded-fern" />
                      <div className="h-5 w-1/2 rounded-full bg-shaded-fern mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ESTADO ERROR */}
            {error && !loading && (
              <div className="rounded-2xl border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-bg))] p-8 text-center my-6">
                <p className="font-semibold text-base text-[rgb(var(--color-danger-text))]">
                  No pudimos cargar los productos
                </p>
                <p className="text-xs text-[rgb(var(--color-danger-text))]/80 mt-1">{error}</p>
                <button
                  type="button"
                  onClick={loadProducts}
                  className="btn btn-primary mt-4 text-xs font-semibold"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* SIN RESULTADOS */}
            {!loading && !error && products.length === 0 && (
              <div className="bg-deep-lichen border border-spruce-border rounded-2xl p-12 text-center my-4">
                <PackageOpen size={48} className="mx-auto mb-3 text-sage-gray/50" />
                <h3 className="text-base font-bold text-white">No encontramos productos</h3>
                <p className="text-xs text-sage-gray mt-1 max-w-sm mx-auto">
                  Probá ajustando o limpiando los filtros de búsqueda para ver más opciones de fábrica.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="btn btn-primary mt-6 text-xs font-bold"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* GRILLA DE PRODUCTOS */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      img={product.images?.[0] || ""}
                      name={product.name}
                      provider={product.brand || "Carsoplac"}
                      category={
                        typeof product.category === "object" && product.category?.name
                          ? product.category.name
                          : "Placas"
                      }
                      price={`$${(product.price ?? 0).toLocaleString("es-AR")}`}
                      onClick={() => navigate(`/productos/${product.id}`)}
                    />
                  ))}
                </div>

                {/* PAGINACIÓN SERVER-SIDE */}
                {totalPages > 1 && (
                  <nav
                    aria-label="Paginación del catálogo"
                    className="flex flex-wrap items-center justify-center gap-2 mt-10 pt-6 border-t border-spruce-border"
                  >
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Página anterior"
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-deep-lichen border border-spruce-border text-sage-gray hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        // En catálogos grandes, mostrar paginación concisa
                        if (
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                        ) {
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPage(p)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                                page === p
                                  ? "bg-accent-brand text-midnight-forest shadow-sm"
                                  : "bg-deep-lichen border border-spruce-border text-sage-gray hover:text-white hover:bg-shaded-fern"
                              }`}
                            >
                              {p}
                            </button>
                          );
                        } else if (p === page - 2 || p === page + 2) {
                          return (
                            <span key={p} className="px-1 text-sage-gray text-xs">
                              …
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label="Página siguiente"
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-deep-lichen border border-spruce-border text-sage-gray hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* DRAWER MÓVIL DE FILTROS */}
      {mobileFiltersOpen && (
        <>
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-deep-lichen border-l border-spruce-border p-5 shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de búsqueda"
          >
            <FilterPanel
              selectedCategory={selectedCategory}
              setSelectedCategory={(c) => {
                setSelectedCategory(c);
                setPage(1);
              }}
              search={search}
              setSearch={setSearch}
              minPrice={minPrice}
              setMinPrice={(v) => {
                setMinPrice(v);
                setPage(1);
              }}
              maxPrice={maxPrice}
              setMaxPrice={(v) => {
                setMaxPrice(v);
                setPage(1);
              }}
              brand={brand}
              setBrand={(b) => {
                setBrand(b);
                setPage(1);
              }}
              inStock={inStock}
              setInStock={(s) => {
                setInStock(s);
                setPage(1);
              }}
              sortBy={sortBy}
              setSortBy={(s) => {
                setSortBy(s);
                setPage(1);
              }}
              categories={categories}
              brands={brands}
              onClose={() => setMobileFiltersOpen(false)}
              isDrawer={true}
            />
          </aside>
        </>
      )}

      {/* SECCIÓN PREGUNTAS FRECUENTES */}
      <div className="mt-16">
        <FaqSection />
      </div>
    </div>
  );
}