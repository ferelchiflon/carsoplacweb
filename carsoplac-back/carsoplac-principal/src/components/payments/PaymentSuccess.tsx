import { useEffect } from "react";

const PaymentSuccess = () => {
  useEffect(() => {
    // Puedes extraer parámetros de la URL si necesitas
    const query = new URLSearchParams(window.location.search);
    const paymentId = query.get("payment_id");
    const status = query.get("status");

    console.log("Pago exitoso:", { paymentId, status });
  }, []);

  return (
    <div>
      <h1 className="bg-shaded-fern text-white">¡Pago Exitoso!</h1>
      <p>Tu pago se ha procesado correctamente.</p>
    </div>
  );
};

export default PaymentSuccess;
