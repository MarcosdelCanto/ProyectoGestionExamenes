import api from './api';

/**
 * Obtiene todas las jornadas.
 * @returns {Promise<Array<Object>>} - Un array de jornadas.
 */
export const fetchAllJornadas = async () => {
  try {
    const response = await api.get('/jornada');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching jornadas:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene una jornada específica por su ID.
 * @param {string|number} id - El ID de la jornada.
 * @returns {Promise<Object>} - El objeto de la jornada.
 */
export const fetchJornadaById = async (id) => {
  try {
    const response = await api.get(`/jornada/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching jornada with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea una nueva jornada.
 * @param {Object} data - Los datos de la jornada a crear.
 * @returns {Promise<Object>} - La jornada creada.
 */
export const createJornada = async (data) => {
  try {
    const response = await api.post('/jornada', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating jornada:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza una jornada existente.
 * @param {string|number} id - El ID de la jornada a actualizar.
 * @param {Object} data - Los nuevos datos para la jornada.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateJornada = async (id, data) => {
  try {
    const response = await api.put(`/jornada/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating jornada ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina una jornada.
 * @param {string|number} id - El ID de la jornada a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const deleteJornada = async (id) => {
  try {
    const response = await api.delete(`/jornada/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting jornada ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Las funciones AddJornada, EditJornada, DeleteJornada eran redundantes y han sido eliminadas
// para mantener la consistencia con las funciones CRUD estándar.
