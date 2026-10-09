import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "../config/api";
import { useAuth } from "../components/layout/hooks/useAuth";

export type FavoriteProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
  brand?: string;
  description?: string;
  category?: { name: string } | string;
};

type FavoritesContextType = {
  favorites: FavoriteProduct[];
  favoriteIds: Set<string>;
  loading: boolean;
  toggleFavorite: (product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    img?: string;
  }) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "carsoplac_guest_favorites";

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar favoritos del usuario si está logueado o de localStorage si es invitado
  const loadFavorites = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/users/me/favorites`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error al cargar favoritos de la cuenta:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Invitado: leer de localStorage
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setFavorites(JSON.parse(saved));
        } else {
          setFavorites([]);
        }
      } catch (e) {
        setFavorites([]);
      }
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const favoriteIds = new Set(favorites.map((p) => p.id));

  const isFavorite = useCallback(
    (productId: string) => {
      return favoriteIds.has(productId);
    },
    [favoriteIds]
  );

  const toggleFavorite = async (product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    img?: string;
  }) => {
    const alreadyFav = favoriteIds.has(product.id);
    const prodImg = product.images?.[0] || product.img || "";
    const fullProduct: FavoriteProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images || (prodImg ? [prodImg] : []),
    };

    if (user) {
      // Optimistic update
      if (alreadyFav) {
        setFavorites((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        setFavorites((prev) => [fullProduct, ...prev]);
      }

      try {
        if (alreadyFav) {
          await fetch(`${API_URL}/users/me/favorites/${product.id}`, {
            method: "DELETE",
            credentials: "include",
          });
        } else {
          await fetch(`${API_URL}/users/me/favorites/${product.id}`, {
            method: "POST",
            credentials: "include",
          });
        }
      } catch (err) {
        console.error("Error al sincronizar favorito:", err);
        // En caso de fallo, recargamos
        loadFavorites();
      }
    } else {
      // Modo invitado: persistir localmente
      let updated: FavoriteProduct[];
      if (alreadyFav) {
        updated = favorites.filter((p) => p.id !== product.id);
      } else {
        updated = [fullProduct, ...favorites];
      }
      setFavorites(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Error guardando en localStorage:", e);
      }
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        loading,
        toggleFavorite,
        isFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites debe ser usado dentro de un FavoritesProvider");
  }
  return context;
};
