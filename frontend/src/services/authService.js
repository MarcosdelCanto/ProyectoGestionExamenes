// src/services/authService.js
import { fetchPermisosByRol } from './permisoService';

// Es buena práctica usar la misma URL base que tu instancia de Axios si es posible,
// o asegurarte de que VITE_API_URL esté configurada.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function login(email_usuario, password_usuario) {
  // No se necesita token de autorización para el login
  const resp = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_usuario, password_usuario }),
  });

  if (!resp.ok) {
    // Intentar obtener un mensaje de error más específico del backend si está disponible
    const errorData = await resp.json().catch(() => null);
    throw new Error(errorData?.message || 'Credenciales inválidas');
  }

  const { accessToken, refreshToken, usuario } = await resp.json();

  // Guarda tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  // Guarda la información del usuario (incluyendo el rol)
  if (usuario && usuario.nombre_rol) {
    // Crea una copia del objeto usuario para no modificar el original
    const userToStore = { ...usuario };
    // Asigna el nombre_rol a la propiedad 'rol' que espera el frontend
    userToStore.rol = usuario.nombre_rol;

    try {
      // Importante: Cargar los permisos inmediatamente después del login
      console.log('Cargando permisos para el rol:', usuario.ROL_ID_ROL);
      const permisos = await fetchPermisosByRol(usuario.ROL_ID_ROL);

      // Agregar los permisos al objeto de usuario
      userToStore.permisos = permisos;
      console.log('Permisos cargados:', permisos.length);
    } catch (error) {
      console.error('Error al cargar permisos durante login:', error);
      userToStore.permisos = []; // Asignar array vacío en caso de error
    }

    // Guardar el usuario con los permisos en localStorage
    localStorage.setItem('user', JSON.stringify(userToStore));
  } else {
    // Es crucial que el rol venga del backend. Si no, el RBAC no funcionará.
    console.error(
      'Error: El objeto usuario recibido del backend no contiene la propiedad "rol".'
    );
    // Limpiamos para evitar un estado inconsistente
    logout();
    throw new Error(
      'Información de usuario incompleta desde el servidor (falta rol).'
    );
  }

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
  localStorage.removeItem('user'); // Asegúrate de limpiar también la info del usuario
  // Opcional: Redirigir o notificar a otras partes de la app
  // window.location.href = '/login'; // Descomentar si quieres redirigir siempre al logout
}

export function getCurrentUser() {
  const token = getAccessToken();
  const userString = localStorage.getItem('user');
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      return { isAuthenticated: true, ...user };
    } catch (e) {
      console.error('Error al parsear datos del usuario desde localStorage', e);
      logout(); // Limpia datos corruptos
      return { isAuthenticated: false, rol: null };
    }
  }
  // Devuelve rol: null si no está autenticado o no hay datos de usuario
  return { isAuthenticated: false, rol: null };
}

// Nueva función para refrescar permisos sin hacer login completo
export async function refreshUserPermissions() {
  const currentUser = getCurrentUser();

  if (currentUser.isAuthenticated && currentUser.ROL_ID_ROL) {
    try {
      console.log('Actualizando permisos para el rol:', currentUser.ROL_ID_ROL);
      const permisos = await fetchPermisosByRol(currentUser.ROL_ID_ROL);

      // Actualizar el objeto de usuario con los nuevos permisos
      const updatedUser = {
        ...currentUser,
        permisos,
      };

      // Guardar el usuario actualizado en localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return permisos;
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      return [];
    }
  }

  return [];
}
