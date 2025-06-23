// src/services/authService.js
import { fetchPermisosByRol } from './permisoService';

// --- CAMBIO CLAVE AQUÍ ---
// Usamos una ruta relativa. Nginx en producción se encargará de redirigirla.
const baseURL = '/api';

// El resto de las funciones ahora usarán esta baseURL correcta.
export async function login(email_usuario, password_usuario) {
  const resp = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_usuario, password_usuario }),
  });

  if (!resp.ok) {
    const errorData = await resp
      .json()
      .catch(() => ({ message: 'Error de autenticación desconocido' }));
    throw new Error(errorData?.message || 'Credenciales inválidas');
  }

  const { accessToken, refreshToken, usuario } = await resp.json();

  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  if (usuario && usuario.ROL_ID_ROL) {
    const userToStore = {
      ...usuario,
      isAuthenticated: true,
      rol: usuario.nombre_rol || `ROL_ID_${usuario.ROL_ID_ROL}`,
    };

    try {
      const permisos = await fetchPermisosByRol(usuario.ROL_ID_ROL);
      userToStore.permisos = permisos || [];
    } catch (error) {
      console.error(
        '[AuthService] Error al cargar permisos durante login:',
        error
      );
      userToStore.permisos = [];
    }
    localStorage.setItem('user', JSON.stringify(userToStore));
    return userToStore;
  } else {
    logout();
    throw new Error('Información de usuario incompleta desde el servidor.');
  }
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
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      return { isAuthenticated: true, ...user };
    } catch (e) {
      logout();
      return { isAuthenticated: false, rol: null, permisos: [] };
    }
  }
  return { isAuthenticated: false, rol: null, permisos: [] };
}

export async function refreshCurrentUserPermissions() {
  const currentUserData = getCurrentUser();

  if (currentUserData.isAuthenticated && currentUserData.ROL_ID_ROL) {
    try {
      const permisos = await fetchPermisosByRol(currentUserData.ROL_ID_ROL);
      const updatedUser = {
        ...currentUserData,
        permisos: permisos || [],
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      return { ...currentUserData, permisos: currentUserData.permisos || [] };
    }
  }
  return currentUserData.isAuthenticated
    ? currentUserData
    : { isAuthenticated: false, rol: null, permisos: [] };
}
