// src/config/api.ts
// Única fuente de verdad para la URL del backend.
// Por defecto apunta al deploy en Render; si algún día querés usar un backend
// local, definí VITE_API_URL=http://localhost:3000 en el .env del frontend.
const envUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_URL =
  envUrl && envUrl.trim() !== ""
    ? envUrl.trim().replace(/\/+$/, "")
    : "https://parsoplac-back.onrender.com";
