// src/utils/fetchWithTimeout.ts
// fetch con aborto automático: evita que la página quede "cargando eternamente"
// cuando el servidor no responde (API dormida, conexión colgada, etc.).
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        `El servidor no respondió en ${Math.round(timeoutMs / 1000)} segundos. ` +
          "Si estaba dormido puede tardar en despertar; reintentá en unos momentos.",
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}

// Convierte cualquier error de fetch en un mensaje claro para el usuario.
export function getFetchErrorMsg(err: unknown): string {
  if (err instanceof TypeError) {
    // fetch lanza TypeError cuando no puede conectar (servidor caído / sin red)
    return "No se pudo conectar con el servidor. Verificá que el backend esté corriendo.";
  }
  return err instanceof Error ? err.message : "Error inesperado al cargar los datos.";
}
