import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    '[api] VITE_API_URL no definida, usando fallback: http://localhost:3000',
  );
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // httpOnly cookie jwt
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es 401 y no es el endpoint de login, redirigir
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
