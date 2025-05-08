// src/services/api.js
import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  logout,
} from './authService';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const api = axios.create({ baseURL });

// Interceptor para añadir el token de acceso a cada petición
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

// response interceptor al 401 refresh token y reintentar la petición

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry) {
      config._retry = true;

      if (isRefreshing) {
        // Estamos refrescando: encolamos la petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        });
      }

      isRefreshing = true;
      try {
        // Llamada al endpoint de refresh
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          token: getRefreshToken(),
        });
        const newToken = data.accessToken;
        setAccessToken(newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        // Reintenta la petición original
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (e) {
        processQueue(e, null);
        logout();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
