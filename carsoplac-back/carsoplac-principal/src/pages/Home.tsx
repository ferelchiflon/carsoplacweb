import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import hero1 from "../assets/imagenes/slider/foto.jpg";
import hero2 from "../assets/imagenes/slider/foto2.jpg";
import hero3 from "../assets/imagenes/slider/foto3.jpg";

import ProductCard from "../components/ui/ProductCard";
import SectionHeader from "../components/ui/SectionHeader";
import HeroSlider from "../components/ui/HeroSlider";

import FaqSection from "../components/ui/FaqSection";
import { API_URL } from "../config/api";
import { fetchWithTimeout, getFetchErrorMsg } from "../utils/fetchWithTimeout";

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
};

type FetchState = "loading" | "error" | "empty" | "ready";

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<FetchState>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    // Con timeout: si la API está dormida y cuelga la conexión, abortamos
    // en 30s y mostramos el estado de error en vez de skeletons eternos.
    fetchWithTimeout(`${API_URL}/products`)
      .then((res: Response) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: no se pudieron cargar los productos`);
        }
        return res.json();
      })
      .then((data: Product[]) => {
        if (cancelled) return;
        setProducts(Array.isArray(data) ? data : []);
        setState(Array.isArray(data) && data.length > 0 ? "ready" : "empty");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[Home] fetch products error:", err);
        setErrorMsg(getFetchErrorMsg(err));
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewAll = () => navigate("/productos");
  const handleProductClick = (id: string) => () => navigate(`/productos/${id}`);

  const renderProductsContent = () => {
    if (state === "loading") {
      return (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          aria-busy="true"
          aria-live="polite"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton w-full aspect-[4/5] rounded-xl"
              role="status"
            />
          ))}
          <span className="sr-only">Cargando productos...</span>
        </div>
      );
    }

    if (state === "error") {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center text-white"
          role="alert"
        >
          <p className="text-base font-semibold">No pudimos cargar los productos.</p>
          <p className="text-xs opacity-80 max-w-xs">{errorMsg}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-outline mt-2"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (state === "empty") {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center text-white/80"
          role="status"
        >
          <p className="text-base font-semibold">Aún no hay productos disponibles.</p>
          <p className="text-xs opacity-70 max-w-xs">
            Vuelve pronto, estamos sumando novedades directo de fábrica.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Showcase: máximo 8 productos en home; el catálogo completo
            está en /productos (botón "VER TODO"). */}
        {products.slice(0, 8).map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            img={product.images?.[0]}
            name={product.name}
            provider="LA ROSARINA"
            category="Baldosas"
            price={`$${product.price}`}
            onClick={handleProductClick(product.id)}
          />
        ))}
      </div>
    );
  };

  const slides = [
    { src: hero1, alt: "Carso Plac - Calidad y diseño para tu hogar" },
    { src: hero2, alt: "Catálogo principal de placas" },
    { src: hero3, alt: "Fabricación propia en showroom" },
  ];

  return (
    <main>
      <HeroSlider slides={slides} intervalMs={5000} />

      <section
        aria-labelledby="products-heading"
        className="px-4 bg-midnight-forest"
      >
        <SectionHeader
          title="DIRECTO DE FÁBRICA"
          subtitle="CALIDAD EN TU HOGAR"
          onViewAll={handleViewAll}
        />
        <h2 id="products-heading" className="sr-only">
          Productos
        </h2>

        {renderProductsContent()}
      </section>

      <div className="w-full">
        <FaqSection />
      </div>
    </main>
  );
}
