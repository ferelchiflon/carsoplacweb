import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

type Props = {
  preferenceId: string;
};

const MercadoPagoButton = ({ preferenceId }: Props) => {
  const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

  // If the key is missing, we show a fallback and log an error.
  if (!mpPublicKey) {
    console.error('MercadoPago public key is not defined. Set VITE_MP_PUBLIC_KEY in your .env file');
    return (
      <div className="mt-2.5 rounded-xl bg-pure-white p-4">
        <div className="w-full max-w-[300px] mx-auto">
          <button disabled className="w-full btn btn-secondary">
            Pago no disponible por el momento
          </button>
        </div>
      </div>
    );
  }

  // Initialize the SDK (we can do it here because we know the key exists)
  initMercadoPago(mpPublicKey);

  return (
    <div className="mt-2.5 rounded-xl bg-pure-white p-4">
      <div className="w-full max-w-[300px] mx-auto">
        <Wallet initialization={{ preferenceId: preferenceId }} />
      </div>
    </div>
  );
};

export default MercadoPagoButton;
