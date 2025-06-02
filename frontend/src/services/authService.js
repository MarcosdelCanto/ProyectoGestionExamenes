// src/services/authService.js
import { fetchPermisosByRol } from './permisoService'; // Asegúrate que la ruta sea correcta

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    // Es crucial tener ROL_ID_ROL
    const userToStore = {
      ...usuario,
      isAuthenticated: true, // Añadimos isAuthenticated aquí
      // Asegúrate que el backend devuelva 'NOMBRE_ROL' si lo necesitas en el frontend
      // Si 'usuario.rol' ya viene como el string del nombre del rol, puedes usarlo directamente
      // o buscarlo aquí si el backend solo envía ROL_ID_ROL.
      // Por simplicidad, asumiremos que 'usuario.nombre_rol' viene del backend.
      rol: usuario.nombre_rol || `ROL_ID_${usuario.ROL_ID_ROL}`, // Fallback si nombre_rol no viene
    };

    try {
      console.log(
        '[AuthService] Cargando permisos para el rol ID:',
        usuario.ROL_ID_ROL
      );
      const permisos = await fetchPermisosByRol(usuario.ROL_ID_ROL); // Esto debe devolver un array de objetos [{NOMBRE_PERMISO: '...'}, ...]
      userToStore.permisos = permisos || []; // Aseguramos que sea un array
      console.log(
        '[AuthService] Permisos cargados para el usuario:',
        userToStore.permisos.length
      );
    } catch (error) {
      console.error(
        '[AuthService] Error al cargar permisos durante login:',
        error
      );
      userToStore.permisos = [];
    }
    localStorage.setItem('user', JSON.stringify(userToStore));
    return userToStore; // Devolvemos el usuario con sus permisos
  } else {
    console.error(
      '[AuthService] Información de usuario incompleta desde el servidor (falta ROL_ID_ROL o nombre_rol).'
    );
    logout(); // Limpiar para evitar estado inconsistente
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
  // Usado por el interceptor de Axios
  localStorage.setItem('accessToken', token);
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Opcional: Despachar un evento o actualizar un estado global para notificar a la app
  // window.location.href = '/login'; // Descomentar si quieres forzar redirección
}

export function getCurrentUser() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      // Aseguramos que tenga la estructura esperada
      return { isAuthenticated: true, ...user };
    } catch (e) {
      console.error(
        '[AuthService] Error al parsear datos del usuario desde localStorage',
        e
      );
      logout();
      return { isAuthenticated: false, rol: null, permisos: [] };
    }
  }
  return { isAuthenticated: false, rol: null, permisos: [] };
}

/**
 * Refresca los permisos del usuario actual desde el backend y actualiza localStorage.
 * Devuelve el objeto de usuario actualizado con sus permisos.
 */
export async function refreshCurrentUserPermissions() {
  const currentUserData = getCurrentUser(); // Obtiene el usuario base de localStorage

  if (currentUserData.isAuthenticated && currentUserData.ROL_ID_ROL) {
    try {
      console.log(
        '[AuthService] Refrescando permisos para el rol ID:',
        currentUserData.ROL_ID_ROL
      );
      const permisos = await fetchPermisosByRol(currentUserData.ROL_ID_ROL);

      const updatedUser = {
        ...currentUserData, // Mantenemos otros datos del usuario
        permisos: permisos || [], // Actualizamos con los nuevos permisos
      };

      localStorage.setItem('user', JSON.stringify(updatedUser)); // Guardamos en localStorage
      console.log('[AuthService] Permisos refrescados y guardados.');
      return updatedUser; // Devolvemos el usuario actualizado
    } catch (error) {
      console.error('[AuthService] Error al refrescar permisos:', error);
      // Devolvemos el usuario que teníamos, pero sin los permisos actualizados o con permisos vacíos
      return { ...currentUserData, permisos: currentUserData.permisos || [] };
    }
  }
  // Si no está autenticado o no tiene rol, devolvemos el usuario tal cual o uno vacío
  return currentUserData.isAuthenticated
    ? currentUserData
    : { isAuthenticated: false, rol: null, permisos: [] };
}
