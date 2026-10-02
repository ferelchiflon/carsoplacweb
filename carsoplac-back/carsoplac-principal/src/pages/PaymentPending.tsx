import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

export default function PaymentPending() {
  return (
    <section className="container-x py-12 md:py-20">
      <div className="rounded-xl border border-spruce-border bg-deep-lichen p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-accent-brand/10">
          <Clock size={32} strokeWidth={2.5} className="text-accent-brand" />
        </div>
        <h1 className="mt-6 h1">
          Tu pago está pendiente
        </h1>
        <p className="mt-3 copy">
          Estamos esperando la confirmación del pago.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link to="/productos" className="btn btn-primary">
            Seguir comprando
          </Link>
          <Link to="/contacto" className="btn btn-ghost">
            Contacto
          </Link>
        </div>
      </div>
    </section>
  );
}
