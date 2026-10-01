import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function PaymentFailure() {
  return (
    <div className="mt-28 px-4 pb-16">
      <section className="mx-auto w-full max-w-[480px] rounded-xl border border-spruce-border bg-deep-lichen p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-bg))]">
          <X size={32} strokeWidth={2.5} className="text-[rgb(var(--color-danger-text))]" />
        </div>
        <h1 className="mt-6 h1 tracking-tight text-white">
          ¡Pago Fallido!
        </h1>
        <p className="mt-3 text-sage-gray">
          No pudimos procesar tu pago. Podés volver a intentarlo cuando quieras.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link to="/productos" className="btn btn-primary">
            Volver a la tienda
          </Link>
          <Link to="/contacto" className="btn btn-ghost">
            Contacto
          </Link>
        </div>
      </section>
    </div>
  );
}
