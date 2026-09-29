import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  src: string;
  alt: string;
};

type Props = {
  slides: Slide[];
  intervalMs?: number;
};

export default function HeroSlider({
  slides,
  intervalMs = 5000,
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const goTo = useCallback((next: number) => {
    setIndex(((next % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto-play
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, total, intervalMs]);

  // Swipe gestures (mobile)
  const SWIPE_THRESHOLD = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (touchStartX.current == null) return;
    if (touchDeltaX.current <= -SWIPE_THRESHOLD) next();
    else if (touchDeltaX.current >= SWIPE_THRESHOLD) prev();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (total === 0) return null;

  return (
    <div
      className="relative w-full h-[calc(100vh-var(--navbar-h))] overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Imágenes destacadas"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`hero-slide absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover object-center select-none"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}

      {/* Caption */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white px-4 pointer-events-none">
        <h2 className="text-3xl sm:text-5xl font-bold text-center drop-shadow-lg">
          Carso Plac
        </h2>
        <p className="text-base sm:text-lg mt-2 text-center font-display drop-shadow-md">
          Calidad y diseño para tu hogar
        </p>
      </div>

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 grid place-items-center rounded-full bg-black/40 hover:bg-black/60 text-white transition active:scale-95"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 grid place-items-center rounded-full bg-black/40 hover:bg-black/60 text-white transition active:scale-95"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
          role="tablist"
          aria-label="Seleccionar imagen"
        >
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir a imagen ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
