import api from './api';

/**
 * Obtiene todas las sedes.
 * @returns {Promise<Array<Object>>} - Un array de sedes.
 */
export const fetchAllSedes = async () => {
  try {
    const response = await api.get('/sede');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching sedes:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene una sede específica por su ID.
 * @param {string|number} id - El ID de la sede.
 * @returns {Promise<Object>} - El objeto de la sede.
 */
export const fetchSedeById = async (id) => {
  try {
    const response = await api.get(`/sede/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching sede with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea una nueva sede.
 * @param {Object} data - Los datos de la sede a crear.
 * @returns {Promise<Object>} - La sede creada.
 */
export const createSede = async (data) => {
  try {
    const response = await api.post('/sede', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating sede:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza una sede existente.
 * @param {string|number} id - El ID de la sede a actualizar.
 * @param {Object} data - Los nuevos datos para la sede.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateSede = async (id, data) => {
  try {
    const response = await api.put(`/sede/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating sede ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Nota: La función deleteSede se omite por brevedad, pero seguiría el mismo patrón.
/**
 * Elimina una sede existente.
 * @param {string|number} id - El ID de la sede a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const deleteSede = async (id) => {
  try {
    const response = await api.delete(`/sede/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting sede ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
