// src/services/authService.js
const API = '/api';

export async function login(email_usuario, password_usuario) {
  const resp = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ email_usuario, password_usuario }),
  });
  if (!resp.ok) throw new Error('Credenciales inválidas');
  const { accessToken, refreshToken, usuario } = await resp.json();

  // Guarda ambos tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return usuario;
}

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}
export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
export function setAccessToken(token) {
  localStorage.setItem('accessToken', token);
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
