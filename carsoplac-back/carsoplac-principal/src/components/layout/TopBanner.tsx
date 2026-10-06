// src/components/layout/TopBanner.tsx
import { Truck, CreditCard, Shield, Headphones, Sparkles } from "lucide-react";

type Msg = {
  Icon: typeof Truck;
  text: string;
};

const messages: Msg[] = [
  { Icon: Truck, text: "ENVÍO GRATIS en compras +$80.000" },
  { Icon: CreditCard, text: "HASTA 12 CUOTAS SIN INTERÉS" },
  { Icon: Shield, text: "COMPRA 100% SEGURA · MercadoPago" },
  { Icon: Headphones, text: "ASISTENCIA PERSONALIZADA por WhatsApp" },
  { Icon: Sparkles, text: "DESCUBRÍ NUESTRO CATÁLOGO 2026" },
];

export default function TopBanner() {
  // Triple para loop continuo sin huecos
  const stream = [...messages, ...messages, ...messages];

  return (
    <div className="relative w-full overflow-hidden bg-shaded-fern text-white h-10 flex items-center">
      {/* Gradientes laterales */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-shaded-fern to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-shaded-fern to-transparent z-10" />

      <div className="flex whitespace-nowrap anim-marquee group motion-reduce:animate-none hover:[animation-play-state:paused]">
        {stream.map((msg, i) => (
          <span
            key={i}
            className="mx-6 inline-flex items-center gap-2 text-xs tracking-[0.14em] font-semibold uppercase"
          >
            <msg.Icon size={13} className="text-accent-brand shrink-0" />
            {msg.text}
            <span className="ml-4 text-accent-brand/70">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
