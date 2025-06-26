// src/services/authService.js
import { fetchPermisosByRol } from './permisoService';
import { listCarrerasByUsuario } from './usuarioCarreraService';
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
      const rolesConCarreras = [
        'JEFE CARRERA',
        'COORDINADOR CARRERA',
        'COORDINADOR DOCENTE',
      ];
      if (rolesConCarreras.includes(userToStore.NOMBRE_ROL)) {
        const carreras = await listCarrerasByUsuario(USUARIO_ID_USUARIO);
        userToStore.carrerasAsociadas = carreras || [];
      } else {
        userToStore.carrerasAsociadas = []; // Asignar un array vacío para otros roles
      }
    } catch (error) {
      console.error(
        '[AuthService] Error al cargar permisos o carreras durante login:',
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

// Función para obtener los permisos del usuario actual directamente desde el endpoint específico
export async function fetchMyPermissions() {
  try {
    const response = await fetch(`${baseURL}/usuarios/my-permissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (response.ok) {
      const permisos = await response.json();
      console.log(
        '[AuthService] Permisos del usuario actual obtenidos:',
        permisos
      );
      return permisos;
    } else {
      console.error(
        '[AuthService] Error al obtener permisos del usuario actual:',
        response.status
      );
      return [];
    }
  } catch (error) {
    console.error('[AuthService] Error en fetchMyPermissions:', error);
    return [];
  }
}

// Función mejorada para refrescar permisos usando el endpoint específico
export async function refreshCurrentUserPermissionsImproved() {
  const currentUserData = getCurrentUser();

  if (currentUserData.isAuthenticated && currentUserData.id_usuario) {
    try {
      // Usamos el nuevo endpoint para obtener permisos del usuario actual
      const [permisos, carreras] = await Promise.all([
        fetchMyPermissions(), // Usar el nuevo endpoint específico
        listCarrerasByUsuario(currentUserData.id_usuario),
      ]);

      const updatedUser = {
        ...currentUserData,
        permisos: permisos || [],
        carrerasAsociadas: carreras || [],
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error(
        '[AuthService] Error al refrescar datos del usuario:',
        error
      );
      // En caso de error, devolvemos los datos que ya teníamos para no romper la sesión
      return {
        ...currentUserData,
        permisos: currentUserData.permisos || [],
        carrerasAsociadas: currentUserData.carrerasAsociadas || [],
      };
    }
  }
  return currentUserData.isAuthenticated
    ? currentUserData
    : {
        isAuthenticated: false,
        rol: null,
        permisos: [],
        carrerasAsociadas: [],
      };
}
