// src/services/authService.js
const API = '/api';

export async function login(email_usuario, password_usuario) {
  const resp = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_usuario, password_usuario }),
  });
  if (!resp.ok) throw new Error('Credenciales inválidas');
  const { token, usuario } = await resp.json();
  // Guarda el token en localStorage
  localStorage.setItem('jwt', token);
  return usuario;
}

export function getToken() {
  return localStorage.getItem('jwt');
}

export function logout() {
  localStorage.removeItem('jwt');
}
