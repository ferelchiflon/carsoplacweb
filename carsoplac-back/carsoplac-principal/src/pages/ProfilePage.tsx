// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/layout/hooks/useAuth";
import { useFavorites } from "../context/FavoritesContext";
import { API_URL } from "../config/api";
import {
  User,
  Package,
  Heart,
  MapPin,
  Phone,
  Mail,
  LogOut,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";

type Tab = "profile" | "orders" | "favorites";

type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: string;
  shippingAddress: string;
  buyerEmail: string;
  buyerPhone: string;
  createdAt: string;
  paidAt?: string;
};

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Perfil detallado
  const [profileData, setProfileData] = useState<{
    name: string;
    phone: string;
    address: string;
    email: string;
    username: string;
  }>({
    name: "",
    phone: "",
    address: "",
    email: "",
    username: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Historial de órdenes
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Cargar datos del perfil completo desde /users/me
  useEffect(() => {
    if (!user) return;

    fetch(`${API_URL}/users/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfileData({
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
            email: data.email || "",
            username: data.username || "",
          });
        }
      })
      .catch((err) => console.error("Error al cargar perfil:", err));
  }, [user]);

  // Cargar órdenes cuando el usuario entra o cambia a tab órdenes
  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    fetch(`${API_URL}/orders/mine`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error al cargar pedidos:", err))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccess(false);
    setProfileError("");

    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el perfil");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || "Error al guardar");
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={13} /> Pagado
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock size={13} /> Pendiente
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Truck size={13} /> Enviado
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <CheckCircle2 size={13} /> Entregado
          </span>
        );
      case "CANCELLED":
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertCircle size={13} /> {status === "EXPIRED" ? "Expirado" : "Cancelado"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate/20 text-sage-gray border border-slate/30">
            {status}
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-accent-brand" size={32} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-var(--navbar-h))] bg-midnight-forest text-white py-8 md:py-12">
      <div className="container-x max-w-5xl">
        {/* Cabecera del usuario */}
        <div className="bg-deep-lichen border border-spruce-border rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-subtle">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-shaded-fern border border-spruce-border flex items-center justify-center text-accent-brand text-2xl font-bold">
              {profileData.name
                ? profileData.name.charAt(0).toUpperCase()
                : profileData.email
                ? profileData.email.charAt(0).toUpperCase()
                : "U"}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {profileData.name || "Mi Cuenta"}
              </h1>
              <p className="text-sm text-sage-gray flex items-center gap-1.5 mt-0.5">
                <Mail size={14} />
                {profileData.email || user.username}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>

        {/* Layout pestañas + contenido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navegación lateral */}
          <aside className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap text-left ${
                activeTab === "profile"
                  ? "bg-accent-brand text-midnight-forest shadow-sm"
                  : "bg-deep-lichen border border-spruce-border text-sage-gray hover:text-white hover:bg-shaded-fern"
              }`}
            >
              <User size={18} />
              <span>Datos personales</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap text-left ${
                activeTab === "orders"
                  ? "bg-accent-brand text-midnight-forest shadow-sm"
                  : "bg-deep-lichen border border-spruce-border text-sage-gray hover:text-white hover:bg-shaded-fern"
              }`}
            >
              <Package size={18} />
              <span>Mis pedidos</span>
              {orders.length > 0 && (
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    activeTab === "orders"
                      ? "bg-midnight-forest text-accent-brand"
                      : "bg-shaded-fern text-white"
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap text-left ${
                activeTab === "favorites"
                  ? "bg-accent-brand text-midnight-forest shadow-sm"
                  : "bg-deep-lichen border border-spruce-border text-sage-gray hover:text-white hover:bg-shaded-fern"
              }`}
            >
              <Heart size={18} />
              <span>Favoritos</span>
              {favorites.length > 0 && (
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    activeTab === "favorites"
                      ? "bg-midnight-forest text-accent-brand"
                      : "bg-shaded-fern text-white"
                  }`}
                >
                  {favorites.length}
                </span>
              )}
            </button>
          </aside>

          {/* Área principal */}
          <main className="md:col-span-3">
            {/* TAB 1: DATOS PERSONALES */}
            {activeTab === "profile" && (
              <div className="bg-deep-lichen border border-spruce-border rounded-2xl p-6 md:p-8 shadow-subtle">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-spruce-border">
                  <div>
                    <h2 className="text-lg font-bold text-white">Datos personales y dirección</h2>
                    <p className="text-xs text-sage-gray mt-1">
                      Completá tus datos para que tus compras en checkout sean más rápidas.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="eyebrow mb-1.5 block">Nombre completo</label>
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-gray" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            setProfileData({ ...profileData, name: e.target.value })
                          }
                          placeholder="Tu nombre y apellido"
                          className="input-base pl-11"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="eyebrow mb-1.5 block">Teléfono de contacto</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-gray" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({ ...profileData, phone: e.target.value })
                          }
                          placeholder="Ej: +54 9 11 1234-5678"
                          className="input-base pl-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="eyebrow mb-1.5 block">Dirección de entrega guardada</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-3 text-sage-gray" />
                      <textarea
                        rows={3}
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({ ...profileData, address: e.target.value })
                        }
                        placeholder="Calle, número, piso/depto, barrio, ciudad y código postal"
                        className="input-base pl-11 py-2.5 resize-none"
                      />
                    </div>
                    <p className="text-[11px] text-sage-gray mt-1">
                      Esta dirección se completará automáticamente al crear pedidos.
                    </p>
                  </div>

                  {saveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      ¡Datos guardados con éxito!
                    </div>
                  )}

                  {profileError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={16} />
                      {profileError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Guardando…
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Guardar cambios
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: HISTORIAL DE PEDIDOS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h2 className="text-lg font-bold text-white">Historial de pedidos</h2>
                  <span className="text-xs text-sage-gray">
                    {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="bg-deep-lichen border border-spruce-border rounded-2xl p-12 text-center text-sage-gray">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-accent-brand" />
                    Cargando pedidos...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-deep-lichen border border-spruce-border rounded-2xl p-12 text-center">
                    <ShoppingBag size={48} className="mx-auto mb-3 text-sage-gray/50" />
                    <h3 className="text-base font-semibold text-white">Aún no realizaste ningún pedido</h3>
                    <p className="text-xs text-sage-gray mt-1 max-w-sm mx-auto">
                      Explorá nuestro catálogo de placas atérmicas y baldosones directo de fábrica.
                    </p>
                    <Link to="/productos" className="btn btn-primary mt-6 inline-flex">
                      Ver catálogo
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-deep-lichen border border-spruce-border rounded-2xl p-5 md:p-6 shadow-subtle hover:border-accent-brand/40 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-spruce-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-sage-gray uppercase">
                              Pedido #{order.id.slice(-6)}
                            </span>
                            {getStatusBadge(order.status)}
                          </div>
                          <span className="text-xs text-sage-gray mt-1 block">
                            {new Date(order.createdAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-sage-gray block">Total</span>
                          <span className="text-lg font-bold text-white">
                            ${Number(order.total).toLocaleString("es-AR")} {order.currency || "ARS"}
                          </span>
                        </div>
                      </div>

                      {/* Items del pedido */}
                      <div className="py-4 space-y-2">
                        {Array.isArray(order.items) &&
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-shaded-fern text-[11px] font-bold grid place-items-center text-accent-brand">
                                  {item.quantity}x
                                </span>
                                <span className="text-white font-medium">{item.name}</span>
                              </div>
                              <span className="text-sage-gray font-mono text-xs">
                                ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                              </span>
                            </div>
                          ))}
                      </div>

                      {/* Dirección de entrega */}
                      {order.shippingAddress && (
                        <div className="pt-3 border-t border-spruce-border/60 flex items-start gap-2 text-xs text-sage-gray">
                          <MapPin size={14} className="shrink-0 mt-0.5 text-accent-brand" />
                          <span>Envío a: {order.shippingAddress}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: FAVORITOS / WISHLIST */}
            {activeTab === "favorites" && (
              <div>
                <div className="flex items-center justify-between pb-4">
                  <h2 className="text-lg font-bold text-white">Mis productos favoritos</h2>
                  <span className="text-xs text-sage-gray">
                    {favorites.length} {favorites.length === 1 ? "guardado" : "guardados"}
                  </span>
                </div>

                {favorites.length === 0 ? (
                  <div className="bg-deep-lichen border border-spruce-border rounded-2xl p-12 text-center">
                    <Heart size={48} className="mx-auto mb-3 text-sage-gray/50" />
                    <h3 className="text-base font-semibold text-white">Tu lista de favoritos está vacía</h3>
                    <p className="text-xs text-sage-gray mt-1 max-w-sm mx-auto">
                      Hacé clic en el ícono de corazón ♡ en cualquier producto para guardarlo acá.
                    </p>
                    <Link to="/productos" className="btn btn-primary mt-6 inline-flex">
                      Explorar productos
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-deep-lichen border border-spruce-border rounded-xl overflow-hidden flex flex-col group hover:border-accent-brand/40 transition"
                      >
                        <div className="relative aspect-[4/3] bg-shaded-fern overflow-hidden">
                          <img
                            src={prod.images?.[0] || "/placeholder.jpg"}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => toggleFavorite(prod)}
                            title="Quitar de favoritos"
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-midnight-forest/80 border border-spruce-border flex items-center justify-center text-accent-brand hover:scale-110 transition"
                          >
                            <Heart size={16} fill="currentColor" />
                          </button>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white line-clamp-1">
                              {prod.name}
                            </h3>
                            <p className="text-base font-bold text-accent-brand mt-1">
                              ${Number(prod.price).toLocaleString("es-AR")}
                            </p>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Link
                              to={`/productos/${prod.id}`}
                              className="btn btn-outline flex-1 text-xs py-2 text-center"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
