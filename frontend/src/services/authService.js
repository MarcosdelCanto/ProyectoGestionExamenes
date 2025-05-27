// src/services/authService.js

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
  // El backend ahora envía `nombre_rol` con el nombre del rol y `rol` con el ID.
  // Queremos que el objeto 'user' en localStorage tenga una propiedad 'rol' con el NOMBRE_ROL.
  if (usuario && usuario.nombre_rol) {
    // Crea una copia del objeto usuario para no modificar el original si se usa en otro lado.
    const userToStore = { ...usuario };
    // Asigna el nombre_rol a la propiedad 'rol' que espera el frontend.
    userToStore.rol = usuario.nombre_rol;
    // Opcionalmente, puedes eliminar nombre_rol si no lo necesitas duplicado o ROL_ID_ROL si 'rol' ya tiene el nombre.
    // delete userToStore.nombre_rol; // Si solo quieres 'rol' con el nombre
    localStorage.setItem('user', JSON.stringify(userToStore));
  } else {
    // Es crucial que el rol venga del backend. Si no, el RBAC no funcionará.
    console.error(
      'Error: El objeto usuario recibido del backend no contiene la propiedad "rol".'
    );
    // Podrías optar por no completar el login o asignar un rol por defecto con permisos mínimos.
    // Por ahora, limpiaremos para evitar un estado inconsistente.
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
  const token = getAccessToken(); // Opcionalmente, puedes basar 'isAuthenticated' solo en la presencia del token
  const userString = localStorage.getItem('user');
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      // 'user' ya debería tener la propiedad 'rol' con el nombre del rol gracias al ajuste en login()
      // Ejemplo: { isAuthenticated: true, id_usuario: ..., email_usuario: ..., rol: "admin", nombre_rol: "admin", ROL_ID_ROL: 1 }
      // o si eliminaste nombre_rol: { isAuthenticated: true, id_usuario: ..., email_usuario: ..., rol: "admin", ROL_ID_ROL: 1 }
      return { isAuthenticated: true, ...user };
    } catch (e) {
      console.error('Error al parsear datos del usuario desde localStorage', e);
      logout(); // Limpia datos corruptos
      // Asegúrate que el objeto devuelto en caso de error también tenga 'rol: null'
      // para consistencia con el caso de no autenticado.
      return { isAuthenticated: false, rol: null };
    }
  }
  // Devuelve rol: null si no está autenticado o no hay datos de usuario
  return { isAuthenticated: false, rol: null };
}
