import api from './api'; // tu instancia de Axios o fetch wrapper
/* se comenta para ver si la segunda funciona bien
export function fetchAllRoles() {
  return api.get('/roles'); // ajusta la URL según tu backend
}
*/

// Obtener todos los roles
export const fetchAllRoles = async () => {
  try {
    const response = await api.get('/roles');
    return response.data; // Asumiendo que la data es el array de roles
    // Si tu API devuelve los roles directamente en response.data:
    // return response.data;
    // Si tu API los devuelve dentro de un objeto como { data: [...] }:
  } catch (error) {
    //console.error('Error fetching roles:', error);
    throw error;
  }
};

// Crear un nuevo rol
export const createRole = async (roleData) => {
  // roleData podría ser { nombre_rol: 'Nuevo Rol', descripcion_rol: 'Descripción' }
  const response = await api.post('/roles', roleData);
  return response.data;
};

// Actualizar un rol existente
export const updateRole = async (roleId, roleData) => {
  // roleData podría ser { nombre_rol: 'Rol Actualizado', descripcion_rol: 'Nueva Descripción' }
  const response = await api.put(`/roles/${roleId}`, roleData);
  return response.data;
};

// Eliminar un rol
export const deleteRole = async (roleId) => {
  const response = await api.delete(`/roles/${roleId}`);
  return response.data; // O simplemente status si no devuelve contenido
};

// Obtener un rol específico por ID (opcional, si lo necesitas)
export const fetchRoleById = async (roleId) => {
  const response = await api.get(`/roles/${roleId}`);
  return response.data;
};

export const fetchRoleByIdWithPermissions = async (idRol) => {
  try {
    const response = await api.get(`/roles/${idRol}`); // Asume que tu API está en /api
    return response.data; // Esto debería devolver { ID_ROL, NOMBRE_ROL, permisos: [...] }
  } catch (error) {
    console.error(`Error al obtener el rol ${idRol} con permisos:`, error);
    throw error;
  }
};
