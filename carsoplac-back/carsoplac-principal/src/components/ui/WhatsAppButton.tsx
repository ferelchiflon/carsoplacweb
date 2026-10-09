// src/components/ui/WhatsAppButton.tsx
import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { getWhatsAppUrl } from "../../config/whatsapp";

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  // Mostrar un tooltip de atención después de 5 segundos la primera vez
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const url = getWhatsAppUrl(customMsg.trim() || undefined);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
    setCustomMsg("");
  };

  const handleDirectClick = () => {
    if (window.innerWidth < 640) {
      // En móviles ir directo a la app para mayor inmediatez
      window.open(getWhatsAppUrl(), "_blank", "noopener,noreferrer");
    } else {
      setIsOpen(!isOpen);
      setShowTooltip(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end print:hidden">
      {/* Popover interactivo para escritorio */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chatear por WhatsApp"
          className="mb-4 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-spruce-border bg-deep-lichen shadow-2xl anim-fade-up"
        >
          {/* Header estilo WhatsApp */}
          <div className="bg-[#075E54] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-base">
                  CP
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#075E54]" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">Carsoplac Ventas</h4>
                <p className="text-[11px] text-white/80">En línea · Respuesta rápida</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
              aria-label="Cerrar chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Burbuja de mensaje inicial */}
          <div className="p-4 bg-midnight-forest/80 space-y-3">
            <div className="bg-shaded-fern border border-spruce-border text-white text-xs p-3 rounded-2xl rounded-tl-sm max-w-[90%] shadow-sm leading-relaxed">
              👋 ¡Hola! ¿Tenés dudas sobre placas atérmicas, baldosones o stock? Escribinos y te asesoramos ahora mismo.
              <span className="block text-[10px] text-sage-gray text-right mt-1.5">
                Directo de fábrica
              </span>
            </div>

            {/* Formulario de mensaje */}
            <form onSubmit={handleSend} className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escribí tu consulta..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-spruce-border bg-deep-lichen text-white placeholder:text-sage-gray text-xs focus:outline-none focus:border-[#25D366] transition"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#25D366] text-midnight-forest flex items-center justify-center hover:brightness-105 active:scale-95 transition"
                  aria-label="Enviar a WhatsApp"
                >
                  <Send size={13} className="ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tooltip flotante si está cerrado */}
      {!isOpen && showTooltip && (
        <div className="mb-2 hidden sm:flex items-center gap-2 bg-deep-lichen border border-spruce-border text-white text-xs px-3.5 py-2 rounded-xl shadow-lg anim-fade-up">
          <span>¿Necesitás asesoramiento? 💬</span>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="text-sage-gray hover:text-white ml-1"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Botón flotante principal de WhatsApp */}
      <button
        type="button"
        onClick={handleDirectClick}
        aria-label="Contactar por WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-[#25D366]/30 cursor-pointer"
      >
        {/* Onda de pulso sutil */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 group-hover:opacity-0 pointer-events-none" />

        {/* Ícono de WhatsApp SVG oficial para nitidez perfecta */}
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          stroke="currentColor"
          strokeWidth="0"
          fill="currentColor"
          className="relative text-white drop-shadow-sm"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.668-.699c.969.585 1.761.884 2.791.885h.002c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.771-5.769-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.087-.179.182-.077.357.101.174.45 1.053 1.24 1.758.828.74 1.528.969 1.745 1.077.217.108.344.094.473-.055.13-.149.559-.65.708-.874.149-.224.298-.188.502-.112.204.076 1.294.61 1.517.721.223.111.372.166.427.26.055.094.055.545-.089.95zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.398A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.636 0-3.15-.478-4.428-1.303l-.317-.206-2.963.831.845-2.889-.224-.339A7.954 7.954 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
        </svg>
      </button>
    </div>
  );
}
