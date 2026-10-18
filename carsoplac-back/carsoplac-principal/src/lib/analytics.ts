// src/lib/analytics.ts
// ──────────────────────────────────────────────────────────────
// Helper ÚNICO de tracking de eventos.
//
// La tienda hoy NO tiene analytics instalado (ni gtag, ni GTM, ni
// Meta Pixel), así que este helper es un no-op seguro hasta que se
// agregue el snippet. Cuando eso pase, los eventos empiezan a
// registrarse solos, sin tocar los componentes.
//
// Dispara en todos los sistemas que estén cargados:
//   1. window.dataLayer  → GTM (y cualquier tagmanager).
//   2. window.gtag       → GA4 directo (gtag.js).
//   3. window.fbq        → Meta Pixel.
// Nunca lanza errores: analytics jamás debe romper la UI.
// ──────────────────────────────────────────────────────────────

export type EventParams = Record<
  string,
  string | number | boolean | undefined | null
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: EventParams = {}): void {
  try {
    // 1) GTM: el objeto y el nombre del evento son la convención estándar.
    window.dataLayer?.push({ event: name, ...params });

    // 2) GA4 directo.
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }

    // 3) Meta Pixel: trackCustom para eventos propios (no estándar).
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", name, params);
    }
  } catch {
    // Silencio total: si un sistema de analytics falla, no afecta a la tienda.
  }
}