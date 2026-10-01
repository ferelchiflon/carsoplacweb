// src/components/layout/SearchDrawer.tsx
import { Search, TrendingUp, Clock, ArrowRight, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const trending = [
  "Mesadas de mármol",
  "Revestimientos símil piedra",
  "Placas cementicias",
  "Mesadas cocina",
  "Muebles a medida",
];

const defaultRecent = ["Sello", "Placa exterior", "Revestimiento living"];

const categories = [
  { name: "Mesadas", to: "/productos?cat=mesadas" },
  { name: "Revestimientos", to: "/productos?cat=revestimientos" },
  { name: "Muebles", to: "/productos?cat=muebles" },
  { name: "Accesorios", to: "/productos?cat=accesorios" },
];

const STORAGE_KEY = "carsoplac:recent-search";

function readRecent(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("readRecent failed", err);
  }
  return defaultRecent;
}

export default function SearchDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecent);

  // 🔒 Bloquear scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  const saveSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [
      clean,
      ...recentSearches.filter((s) => s !== clean),
    ].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("saveSearch failed", err);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("clearRecent failed", err);
    }
  };

  const filteredTrending = useMemo(() => {
    if (!query.trim()) return trending;
    return trending.filter((t) =>
      t.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearch(query);
      onClose();
    }
  };

  const handleSelect = (term: string) => {
    saveSearch(term);
    setQuery(term);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      <div
        className={`fixed inset-x-0 top-0 z-[70] bg-deep-lichen text-white border-b border-spruce-border shadow-subtle transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar productos"
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-spruce-border">
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-gray"
            />
            <input
              autoFocus={open}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="w-full h-11 pl-11 pr-4 rounded-full bg-shaded-fern border border-spruce-border focus:border-accent-brand text-white placeholder:text-sage-gray text-base outline-none transition"
            />
          </form>
          <button
            onClick={onClose}
            aria-label="Cerrar búsqueda"
            className="text-sm font-semibold text-sage-gray hover:text-white"
          >
            Cancelar
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-5 py-5 space-y-7">
          {/* Categorías rápidas */}
          <section>
            <p className="eyebrow mb-3">Buscar por categoría</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Link
                  key={c.name}
                  to={c.to}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl bg-shaded-fern hover:bg-mossy-edge transition"
                >
                  <span className="flex items-center gap-2">
                    <Tag size={14} className="text-accent-brand" />
                    <span className="text-sm font-semibold">{c.name}</span>
                  </span>
                  <ArrowRight size={14} className="opacity-50" />
                </Link>
              ))}
            </div>
          </section>

          {/* Recientes */}
          {recentSearches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="eyebrow flex items-center gap-1.5">
                  <Clock size={12} /> Búsquedas recientes
                </p>
                <button
                  onClick={clearRecent}
                  className="text-[11px] text-sage-gray hover:text-white"
                >
                  Borrar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelect(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-shaded-fern hover:bg-mossy-edge text-sm font-medium transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Trending */}
          <section>
            <p className="eyebrow mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> Tendencias
            </p>
            {filteredTrending.length === 0 ? (
              <p className="text-sm text-sage-gray">
                Sin coincidencias para "{query}".
              </p>
            ) : (
              <ul className="divide-y divide-spruce-border">
                {filteredTrending.map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => handleSelect(t)}
                      aria-label={`Buscar tendencia: ${t}`}
                      className="w-full flex items-center justify-between py-3 text-left hover:text-accent-brand transition"
                    >
                      <span className="flex items-center gap-3">
                        <Search size={14} className="text-sage-gray" />
                        <span className="text-sm font-medium">{t}</span>
                      </span>
                      <ArrowRight size={14} className="opacity-40" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Tip */}
          <section className="rounded-xl bg-shaded-fern p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 grid place-items-center shrink-0">
              <Tag size={16} className="text-accent-brand" />
            </div>
            <div>
              <p className="text-sm font-medium">Tip de búsqueda</p>
              <p className="text-xs text-sage-gray leading-snug mt-0.5">
                Probá buscar por ambiente: "cocina", "living", "exterior".
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
