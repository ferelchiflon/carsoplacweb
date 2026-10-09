// src/components/layout/CartDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext";
import type { CartItem } from "../../context/CartContext";
import { X, Trash2, Plus, Minus, ShieldCheck, Truck } from "lucide-react";
import MercadoPagoButton from "../ui/MercadoPagoButton";
import { API_URL } from "../../config/api";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type CustomerForm = {
  dni: string;
  name: string;
  surname: string;
};

type FormErrors = {
  dni?: string;
  name?: string;
  surname?: string;
};

// 🛡️ Reglas de validación del formulario del cliente
const DNI_REGEX = /^\d+$/;
const DNI_MIN = 7;
const DNI_MAX = 8;
const NAME_MIN = 2;

const validateForm = (customer: CustomerForm): FormErrors => {
  const errors: FormErrors = {};

  const dniTrim = customer.dni.trim();
  if (dniTrim.length === 0) {
    errors.dni = "El DNI es obligatorio.";
  } else if (!DNI_REGEX.test(dniTrim)) {
    errors.dni = "El DNI solo puede contener números.";
  } else if (dniTrim.length < DNI_MIN || dniTrim.length > DNI_MAX) {
    errors.dni = `El DNI debe tener entre ${DNI_MIN} y ${DNI_MAX} dígitos.`;
  }

  if (customer.name.trim().length < NAME_MIN) {
    errors.name = "Ingresá tu nombre.";
  }

  if (customer.surname.trim().length < NAME_MIN) {
    errors.surname = "Ingresá tu apellido.";
  }

  return errors;
};

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, totalItems, total, addToCart, removeFromCart, clearCart } =
    useCart();

  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loadingMp, setLoadingMp] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<CustomerForm>({
    dni: "",
    name: "",
    surname: "",
  });

  const [touched, setTouched] = useState<Record<keyof CustomerForm, boolean>>({
    dni: false,
    name: false,
    surname: false,
  });

  const errors = useMemo(() => validateForm(customer), [customer]);
  const isFormValid = Object.keys(errors).length === 0;

  // 🔁 Si el carrito se vacía, resetear MP
  useEffect(() => {
    if (cart.length === 0) {
      setPreferenceId(null);
    }
  }, [cart.length]);

  // 🔒 Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // 🟢 Confirmar compra → BACK
  const handleConfirmPurchase = async () => {
    // Marca todos los campos como tocados para mostrar errores si los hubiera
    setTouched({ dni: true, name: true, surname: true });
    if (!isFormValid) return;

    const trimmedCustomer: CustomerForm = {
      dni: customer.dni.trim(),
      name: customer.name.trim(),
      surname: customer.surname.trim(),
    };

    setLoadingMp(true);
    setMpError(null);

    try {
      const res = await fetch(
        `${API_URL}/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
            shippingAddress: `DNI: ${trimmedCustomer.dni} - ${trimmedCustomer.name} ${trimmedCustomer.surname}`,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error desconocido');
      }

      const data = await res.json();
      // Expecting { initPoint, orderId }
      if (!data.initPoint) {
        throw new Error('Respuesta inesperada del servidor');
      }
      window.location.href = data.initPoint;
    } catch (error: any) {
      setMpError(error?.message ?? 'No se pudo iniciar el pago. Intentá nuevamente.');
      console.error(error);
    } finally {
      setLoadingMp(false);
    }  };

  const increaseQuantity = (item: CartItem) => addToCart({ ...item, quantity: 1 });

  const decreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) addToCart({ ...item, quantity: -1 });
    else removeFromCart(item.id);
  };

  const formatPrice = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  const showError = (field: keyof CustomerForm) =>
    touched[field] && Boolean(errors[field]);

  const inputClass = (field: keyof CustomerForm) =>
    `input-base !h-11 !rounded-xl ${
      showError(field)
        ? "border-[rgb(var(--color-danger-border))] focus:border-[rgb(var(--color-danger-border))]"
        : ""
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[440px] bg-deep-lichen text-white border-l border-spruce-border shadow-md flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-spruce-border">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base h2 tracking-tight">Tu carrito</h2>
            <span className="text-xs text-sage-gray">
              ({totalItems} {totalItems === 1 ? "producto" : "productos"})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                aria-label="Vaciar carrito"
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10 text-white"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar carrito"
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10 text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Productos */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-full bg-shaded-fern grid place-items-center mb-4">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sage-gray">
                  <path d="M6 6h15l-1.5 9h-12z" />
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                  <path d="M6 6L5 3H2" />
                </svg>
              </div>
              <p className="mb-1 copy">Tu carrito está vacío</p>
              <p className="text-sm text-sage-gray mb-5 max-w-[260px]">
                Explorá nuestro catálogo y elegí las placas que mejor se adaptan a tu proyecto.
              </p>
              <button onClick={onClose} className="btn btn-primary">
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-spruce-border">
              {cart.map((item) => (
                <li key={item.id} className="py-4 flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-shaded-fern overflow-hidden shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-[10px] text-sage-gray">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h2 className="h2 leading-snug line-clamp-2">
                        {item.name}
                      </h2>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Eliminar producto"
                        className="text-sage-gray hover:text-white shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center bg-shaded-fern text-white rounded-full">
                        <button
                          onClick={() => decreaseQuantity(item)}
                          className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10"
                          aria-label="Restar"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item)}
                          className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10"
                          aria-label="Sumar"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Trust strip */}
        {cart.length > 0 && (
          <div className="px-6 py-3 border-t border-spruce-border bg-shaded-fern flex items-center justify-between text-[11px] text-sage-gray">
            <span className="inline-flex items-center gap-1.5">
              <Truck size={14} /> Envío a todo el país
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} /> Compra segura
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              3 y 6 cuotas sin interés
            </span>
          </div>
        )}

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-spruce-border space-y-3 bg-deep-lichen">
            <div className="space-y-2">
              <p className="eyebrow">Tus datos</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    minLength={DNI_MIN}
                    maxLength={DNI_MAX}
                    placeholder="DNI"
                    value={customer.dni}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={showError("dni")}
                    aria-describedby={showError("dni") ? "dni-error" : undefined}
                    className={inputClass("dni")}
                  />
                  {showError("dni") && (
                    <p id="dni-error" className="text-[11px] text-[rgb(var(--color-danger-text))] mt-1">
                      {errors.dni}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    name="name"
                    type="text"
                    minLength={NAME_MIN}
                    placeholder="Nombre"
                    value={customer.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={showError("name")}
                    aria-describedby={showError("name") ? "name-error" : undefined}
                    className={inputClass("name")}
                  />
                  {showError("name") && (
                    <p id="name-error" className="text-[11px] text-[rgb(var(--color-danger-text))] mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <input
                  name="surname"
                  type="text"
                  minLength={NAME_MIN}
                  placeholder="Apellido"
                  value={customer.surname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={showError("surname")}
                  aria-describedby={showError("surname") ? "surname-error" : undefined}
                  className={inputClass("surname")}
                />
                {showError("surname") && (
                  <p id="surname-error" className="text-[11px] text-[rgb(var(--color-danger-text))] mt-1">
                    {errors.surname}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-2">
              <span className="text-sm text-sage-gray">Subtotal</span>
              <span className="text-xl font-medium">{formatPrice(total)}</span>
            </div>

            {!preferenceId && (
              <button
                onClick={handleConfirmPurchase}
                disabled={loadingMp || !isFormValid}
                className="btn btn-primary w-full !rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMp ? "Procesando..." : "Continuar al pago"}
              </button>
            )}

            {mpError && (
              <p className="text-[rgb(var(--color-danger-text))] text-center text-sm">
                {mpError}
              </p>
            )}

            {preferenceId && <MercadoPagoButton preferenceId={preferenceId} />}

            <p className="text-[11px] text-sage-gray text-center">
              Al continuar aceptás nuestros términos y condiciones.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
