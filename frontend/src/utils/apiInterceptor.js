// src/utils/apiInterceptor.js
import {
  getAccessToken,
  refreshAccessToken,
  logout,
} from '../services/authService';

// Interceptor personalizado para manejo de tokens
class ApiInterceptor {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Procesar cola de peticiones fallidas después del refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Método principal para hacer peticiones con manejo automático de tokens
  async request(url, options = {}) {
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new Error('No hay token de acceso');
    }

    // Configurar headers con token
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await fetch(url, requestOptions);

      // Si la respuesta es exitosa, devolverla
      if (response.ok) {
        return response;
      }

      // Si es un error 401 (Unauthorized)
      if (response.status === 401) {
        const errorData = await response
          .clone()
          .json()
          .catch(() => ({}));

        // Si el token expiró
        if (errorData.codigo === 'TOKEN_EXPIRED') {
          return this.handleTokenExpired(url, requestOptions);
        }
      }

      return response;
    } catch (error) {
      console.error('Error en petición API:', error);
      throw error;
    }
  }

  // Manejar token expirado
  async handleTokenExpired(originalUrl, originalOptions) {
    // Si ya hay un proceso de refresh en curso, agregar a la cola
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalOptions.headers['Authorization'] = `Bearer ${token}`;
        return fetch(originalUrl, originalOptions);
      });
    }

    this.isRefreshing = true;

    try {
      // Intentar refrescar el token
      const newToken = await refreshAccessToken();

      // Procesar cola exitosamente
      this.processQueue(null, newToken);

      // Reintentar petición original con nuevo token
      originalOptions.headers['Authorization'] = `Bearer ${newToken}`;
      return fetch(originalUrl, originalOptions);
    } catch (refreshError) {
      // Si falla el refresh, procesar cola con error
      this.processQueue(refreshError, null);

      // Logout y redirigir
      logout();

      // Solo redirigir si no estamos ya en login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    } finally {
      this.isRefreshing = false;
    }
  }

  // Métodos de conveniencia para diferentes tipos de peticiones
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  async patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Crear instancia singleton
const apiClient = new ApiInterceptor();

export default apiClient;
