import { Link } from "react-router-dom";
import { Check } from "lucide-react";

export default function PaymentSuccess() {
  return (
    <section className="container-x py-12 md:py-20">
      <div className="rounded-xl border border-spruce-border bg-deep-lichen p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-md border border-[rgb(var(--color-success-border))] bg-[rgb(var(--color-success-bg))]">
          <Check size={32} strokeWidth={2.5} className="text-[rgb(var(--color-success-text))]" />
        </div>
        <h1 className="mt-6 h1">
          ¡Pago Exitoso!
        </h1>
        <p className="mt-3 copy">
          Tu pago se ha procesado correctamente.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/productos" className="btn btn-primary">
            Seguir comprando
          </Link>
        </div>
      </div>
    </section>
  );
}
