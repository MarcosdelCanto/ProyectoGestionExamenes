// src/services/api.js
import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  logout,
} from './authService';

// 1. URL Base Relativa (La clave del éxito)
// Al usar '/api', tu frontend buscará la API en el mismo dominio desde donde se sirve la página.
// - En tu Mac, Vite lo redirigirá a http://localhost:3000/api.
// - En AWS, Nginx lo redirigirá al contenedor del backend.
// ¡Es la solución perfecta para ambos entornos!
const baseURL = '/api';

// 2. Creación de la Instancia de Axios
// Aquí se establece que todas las llamadas hechas con 'api' (ej. api.get('/usuarios'))
// tendrán el prefijo '/api'.
const api = axios.create({ baseURL });

// 3. Interceptor de Petición (Request)
// Esto está perfecto. Añade el token de autorización a cada petición saliente.
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Interceptor de Respuesta (Refresh Token)
// Esta lógica es robusta. Si una petición falla por token expirado (error 401),
// intentará obtener un nuevo token de acceso usando el refresh token.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        // Usamos axios.post con la URL completa para evitar que este interceptor se llame a sí mismo en un bucle.
        const res = await axios.post(`${baseURL}/auth/refresh`, {
          token: refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        return api(originalRequest);
      } catch (_error) {
        processQueue(_error, null);
        logout(); // Si el refresh token falla, cerramos sesión.
        window.location = '/login';
        return Promise.reject(_error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
