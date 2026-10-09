// src/constants/index.ts
// Base del sistema Distrolac (compartido con la tienda).
// Se deriva de VITE_BACK_APP_URI quitando el sufijo /api:
//   prod  -> https://tiendastagingserver.administraciondistrolac.com
//   dev   -> http://127.0.0.1:4000 (o vacío si VITE_BACK_APP_URI es relativo)
const rawUri: string = import.meta.env.VITE_BACK_APP_URI ?? "/api";
export const BASE_URL = rawUri.replace(/\/api\/?$/, "").replace(/\/$/, "");
export const AUTH_URL = "/api/store/auth";
