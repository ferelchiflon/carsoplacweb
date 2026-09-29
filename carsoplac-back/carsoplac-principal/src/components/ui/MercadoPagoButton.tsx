import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

// Inicializa Mercado Pago con tu Public Key
initMercadoPago("APP_USR-9015ddba-4779-486d-9fef-7f84ca30b382");

type Props = {
  preferenceId: string;
};

const MercadoPagoButton = ({ preferenceId }: Props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "10px",
      }}
    >
      {/* Renderiza el botón de pago */}
      <div style={{ width: "300px" }}>
        <Wallet initialization={{ preferenceId: preferenceId }} />
      </div>
    </div>
  );
};

export default MercadoPagoButton;
