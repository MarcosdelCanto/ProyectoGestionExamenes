import api from './api';

// Obtener todos los permisos
export const fetchAllPermisos = async () => {
  try {
    const response = await api.get('/permisos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    throw error;
  }
};

// Obtener permisos por ID de rol (esta es la función clave)
export const fetchPermisosByRol = async (idRol) => {
  try {
    const response = await api.get(`/permisos/rol/${idRol}`);
    console.log(`Permisos cargados para rol ${idRol}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener permisos del rol ${idRol}:`, error);
    return [];
  }
};

// Actualizar permisos de un rol
export const updatePermisosRol = async (idRol, permisos) => {
  try {
    const response = await api.put(`/permisos/rol/${idRol}`, { permisos });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar permisos del rol ${idRol}:`, error);
    throw error;
  }
};
