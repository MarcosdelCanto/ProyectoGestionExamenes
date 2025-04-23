// src/services/api.js
import { getToken } from './authService';

export async function fetchWithAuth(path, opts = {}) {
  const token = getToken();
  if (!token) throw new Error('No autenticado');
  const headers = {
    ...(opts.headers || {}),
    Authorization: `Bearer ${token}`,
  };
  const resp = await fetch(path, { ...opts, headers });
  if (resp.status === 401) {
    // token inválido/expirado: redirigir al login
    window.location.href = '/login';
    return;
  }
  return resp;
}
