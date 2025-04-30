// src/services/api.js
import {
  getAccessToken,
  getRefreshToken,
  logout as doLogout,
} from './authService';

let isRefreshing = false;
let queue = [];

// Al terminar el refresh, avisamos a todas las peticiones en cola
function onRefreshed(newToken) {
  queue.forEach((cb) => cb(newToken));
  queue = [];
}

export async function fetchWithAuth(path, opts = {}) {
  let token = getAccessToken();
  if (!token) throw new Error('No autenticado');

  const callApi = (bearer) =>
    fetch(path, {
      ...opts,
      headers: { ...(opts.headers || {}), Authorization: `Bearer ${bearer}` },
    });

  let resp = await callApi(token);
  if (resp.status !== 401) return resp;

  // Si ya estamos refrescando, esperamos nuestro turno
  if (isRefreshing) {
    return new Promise((resolve) => {
      queue.push((newToken) => resolve(callApi(newToken)));
    });
  }

  // Primer 401 → lanzamos el refresh
  isRefreshing = true;
  const refreshToken = getRefreshToken();
  const r = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!r.ok) {
    // refresh falló: cerramos sesión
    doLogout();
    window.location.href = '/login';
    return resp;
  }

  const { accessToken: newToken } = await r.json();
  localStorage.setItem('accessToken', newToken);
  token = newToken;
  isRefreshing = false;
  onRefreshed(newToken);

  // Reintento de la petición original
  return callApi(newToken);
}
