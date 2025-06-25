import api from './api.js';

const BASE = '/moduloUsuarios';

export const listUsuarios = async () => {
  try {
    const response = await api.get('/usuarios'); // o la ruta que tengas
    return Array.isArray(response.data) ? response.data : []; // Asegura que sea un array
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return []; // Devuelve array vacío en caso de error
  }
};
export const createUsuario = (payload) =>
  api
    .post(BASE, payload)
    .then((res) => res.data)
    .catch((err) => {
      console.error('createUsuario error:', err);
      throw err;
    });

export const updateUsuario = (id, payload) =>
  api
    .put(`${BASE}/${id}`, payload)
    .then((res) => res.data)
    .catch((err) => {
      console.error('updateUsuario error:', err);
      throw err;
    });

export const deleteUsuario = (id) =>
  api
    .delete(`${BASE}/${id}`)
    .then((res) => res.data)
    .catch((err) => {
      console.error('deleteUsuario error:', err);
      throw err;
    });

/**
 * Elimina un usuario por su ID.
 * Esta es la función preferida para eliminar usuarios individualmente.
 * @param {string|number} id - El ID del usuario a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`); // Ruta para eliminación individual
    return response.data;
  } catch (error) {
    console.error(
      `Error al eliminar usuario ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina múltiples usuarios por sus IDs.
 * Envía un array de IDs al backend para eliminación masiva.
 * @param {Array<string|number>} ids - Un array de IDs de usuarios a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor, incluyendo un resumen de la operación.
 */
export const deleteMultipleUsers = async (ids) => {
  try {
    const response = await api.post('/usuarios/bulk-delete', { ids }); // Nueva ruta y cuerpo con array de IDs
    return response.data;
  } catch (error) {
    console.error(
      `Error al eliminar múltiples usuarios:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export const importUsuarios = (rows) =>
  api
    .post(`${BASE}/import`, rows)
    .then((res) => res.data)
    .catch((err) => {
      console.error('importUsuarios error:', err);
      throw err;
    });

export const getRoles = () =>
  api
    .get('/roles')
    .then((res) => res.data)
    .catch((err) => {
      console.error('getRoles error:', err);
      throw err;
    });

export const resetPassword = (id) =>
  api
    .put(`${BASE}/${id}/password`)
    .then((res) => res.data)
    .catch((err) => {
      console.error('resetPassword error:', err);
      throw err;
    });

// Ejemplo en tu archivo de servicio (services/usuarioService.js)

export const fetchAllDocentes = async () => {
  try {
    // NOTA: Asegúrate de que el ID del rol 'DOCENTE' en tu tabla ROL sea realmente 2.
    const response = await api.get('/usuarios/docentes');
    if (!Array.isArray(response.data)) {
      throw new Error('Se espera una lista de docentes');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching docentes:', error);
    throw error;
  }
};

// NUEVA FUNCIÓN para buscar docentes por nombre (más escalable)
export const searchDocentes = async (searchTerm) => {
  try {
    // El backend buscará docentes cuyo nombre contenga el término de búsqueda
    const { data } = await api.get(`/usuarios/docentes/search?q=${searchTerm}`);
    return data;
  } catch (error) {
    console.error('Error al buscar docentes:', error);
    throw error;
  }
};
export const fetchDocentesBySeccion = async (seccionId) => {
  try {
    const response = await api.get(`/seccion/secciones/${seccionId}/docentes`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching docentes para la sección ${seccionId}:`,
      error
    );
    throw error;
  }
};
