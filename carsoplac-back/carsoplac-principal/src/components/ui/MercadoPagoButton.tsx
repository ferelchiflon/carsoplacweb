import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

// Inicializa Mercado Pago con tu Public Key
const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
if (!mpPublicKey) {
  throw new Error('MercadoPago public key is not defined. Set VITE_MP_PUBLIC_KEY in your .env file');
}
initMercadoPago(mpPublicKey);

type Props = {
  preferenceId: string;
};

const MercadoPagoButton = ({ preferenceId }: Props) => {
  return (
    // Tarjeta clara obligatoria: el wallet de MercadoPago trae su propio
    // estilo de marca (fondo blanco + azul) y sobre el canvas oscuro
    // quedaría ilegible.
    <div className="mt-2.5 rounded-xl bg-pure-white p-4">
      {/* Antes era un width fijo de 300px, que desbordaba el drawer a 375px.
          Ahora es fluido con un máximo razonable. */}
      <div className="w-full max-w-[300px] mx-auto">
        <Wallet initialization={{ preferenceId: preferenceId }} />
      </div>
    </div>
  );
};

export default MercadoPagoButton;
