// src/components/ui/FilterPanel.tsx
import { useMemo } from "react";
import type { Category } from "../../pages/ProductsPage";
import { Filter, X, Check, ArrowDownUp, Tag, Layers, DollarSign } from "lucide-react";

type FilterPanelProps = {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  brand: string;
  setBrand: (value: string) => void;
  inStock: boolean;
  setInStock: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  categories: Category[];
  brands: string[];
  onClose?: () => void; // Para cerrar el drawer en mobile
  isDrawer?: boolean;
};

export default function FilterPanel({
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  brand,
  setBrand,
  inStock,
  setInStock,
  sortBy,
  setSortBy,
  categories,
  brands,
  onClose,
  isDrawer = false,
}: FilterPanelProps) {
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (brand !== "all") count++;
    if (inStock) count++;
    if (sortBy !== "newest") count++;
    return count;
  }, [selectedCategory, minPrice, maxPrice, brand, inStock, sortBy]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setBrand("all");
    setInStock(false);
    setSortBy("newest");
  };

  return (
    <div className={`flex flex-col ${isDrawer ? "h-full" : "bg-deep-lichen border border-spruce-border rounded-2xl p-5 shadow-subtle"}`}>
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-spruce-border">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-accent-brand" />
          <h3 className="text-base font-bold text-white">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-accent-brand text-midnight-forest text-[11px] font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-accent-brand hover:underline font-semibold transition"
            >
              Limpiar
            </button>
          )}
          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-shaded-fern text-white flex items-center justify-center hover:bg-mist-gray hover:text-midnight-forest transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-1">
        {/* Ordenamiento */}
        <div>
          <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <ArrowDownUp size={14} className="text-accent-brand" />
            Ordenar por
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-spruce-border bg-shaded-fern text-white text-xs font-medium focus:outline-none focus:border-accent-brand transition"
          >
            <option value="newest">Más recientes</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
            <option value="name_asc">Nombre: A - Z</option>
            <option value="name_desc">Nombre: Z - A</option>
          </select>
        </div>

        {/* Disponibilidad (Stock) */}
        <div className="pt-2 border-t border-spruce-border/60">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 rounded border-spruce-border accent-emerald-400 bg-shaded-fern"
            />
            <span className="text-xs font-medium text-white group-hover:text-accent-brand transition">
              Solo productos en stock
            </span>
          </label>
        </div>

        {/* Categorías */}
        <div className="pt-2 border-t border-spruce-border/60">
          <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Layers size={14} className="text-accent-brand" />
            Categoría
          </label>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                selectedCategory === "all"
                  ? "bg-accent-brand text-midnight-forest font-bold"
                  : "text-sage-gray hover:text-white hover:bg-shaded-fern"
              }`}
            >
              <span>Todas las categorías</span>
              {selectedCategory === "all" && <Check size={14} />}
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                    isSelected
                      ? "bg-accent-brand text-midnight-forest font-bold"
                      : "text-sage-gray hover:text-white hover:bg-shaded-fern"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Marcas */}
        {brands.length > 0 && (
          <div className="pt-2 border-t border-spruce-border/60">
            <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Tag size={14} className="text-accent-brand" />
              Marca / Proveedor
            </label>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setBrand("all")}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                  brand === "all"
                    ? "bg-accent-brand text-midnight-forest font-bold"
                    : "text-sage-gray hover:text-white hover:bg-shaded-fern"
                }`}
              >
                <span>Todas las marcas</span>
                {brand === "all" && <Check size={14} />}
              </button>
              {brands.map((b) => {
                const isSelected = brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                      isSelected
                        ? "bg-accent-brand text-midnight-forest font-bold"
                        : "text-sage-gray hover:text-white hover:bg-shaded-fern"
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rango de precio */}
        <div className="pt-2 border-t border-spruce-border/60">
          <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <DollarSign size={14} className="text-accent-brand" />
            Rango de precio ($)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Mínimo"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-spruce-border bg-shaded-fern text-white placeholder:text-sage-gray text-xs focus:outline-none focus:border-accent-brand transition"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Máximo"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-spruce-border bg-shaded-fern text-white placeholder:text-sage-gray text-xs focus:outline-none focus:border-accent-brand transition"
              />
            </div>
          </div>
        </div>
      </div>

      {isDrawer && onClose && (
        <div className="pt-4 mt-4 border-t border-spruce-border">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary w-full text-xs font-bold"
          >
            Ver resultados
          </button>
        </div>
      )}
    </div>
  );
}
