// import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

type Props = {
  preferenceId: string;
};

const MercadoPagoButton = ({ preferenceId }: Props) => {
  // TEMPORARILY DISABLED: MercadoPago functionality is disabled for now
  // To re-enable, uncomment the imports and restore the normal logic below
  
  console.info('MercadoPago is temporarily disabled. Showing fallback UI.');
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void preferenceId;
  
  return (
    <div className="mt-2.5 rounded-xl bg-pure-white p-4">
      <div className="w-full max-w-[300px] mx-auto">
        <button disabled className="w-full btn btn-secondary opacity-50">
          Pagos desactivados temporalmente
        </button>
        <p className="mt-2 text-sm text-muted-foreground">
          La funcionalidad de pago está desactivada por el momento.
          Por favor, contacte al administrador para más información.
        </p>
      </div>
    </div>
  );
  
  /*
  // NORMAL LOGIC (to restore when re-enabling MercadoPago)
  import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

  const MercadoPagoButton = ({ preferenceId }: Props) => {
    const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

    // If the key is missing or is the placeholder, we show a fallback and log an error.
    if (!mpPublicKey || mpPublicKey === 'tu_clave_publica_aqui') {
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
  */
};

export default MercadoPagoButton;
