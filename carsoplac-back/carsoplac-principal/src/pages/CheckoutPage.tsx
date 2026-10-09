import { useCart } from "../context/CartContext";

export default function CheckoutPage() {
  const { cart } = useCart();
  return (
    <div className="container-x pt-12">
      <h1 className="mb-4 text-2xl font-bold text-white">Checkout</h1>
      {cart.length === 0 ? (
        <p className="mb-4">Tu carrito está vacío</p>
      ) : (
        <>
          <p className="mb-4">Página de checkout en construcción.</p>
          <p className="mb-4">
            <a href="/productos" className="btn btn-outline">
              Seguir comprando
            </a>
          </p>
        </>
      )}
    </div>
  );
}
