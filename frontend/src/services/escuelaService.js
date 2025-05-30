import api from './api';

/**
 * Obtiene todas las escuelas.
 * @returns {Promise<Array<Object>>} - Un array de escuelas.
 */
export const fetchAllEscuelas = async () => {
  try {
    const response = await api.get('/escuela');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching escuelas:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene una escuela específica por su ID.
 * @param {string|number} id - El ID de la escuela.
 * @returns {Promise<Object>} - El objeto de la escuela.
 */
export const fetchEscuelaById = async (id) => {
  try {
    const response = await api.get(`/escuela/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching escuela with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea una nueva escuela.
 * @param {Object} data - Los datos de la escuela a crear.
 * @returns {Promise<Object>} - La escuela creada.
 */
export const createEscuela = async (data) => {
  try {
    const response = await api.post('/escuela', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating escuela:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza una escuela existente.
 * @param {string|number} id - El ID de la escuela a actualizar.
 * @param {Object} data - Los nuevos datos para la escuela.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateEscuela = async (id, data) => {
  try {
    const response = await api.put(`/escuela/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating escuela ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina una escuela.
 * @param {string|number} id - El ID de la escuela a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const deleteEscuela = async (id) => {
  try {
    const response = await api.delete(`/escuela/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting escuela ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene todas las escuelas asociadas a una sede específica.
 * Usado para los filtros dependientes en el dashboard.
 * @param {string|number} sedeId - El ID de la sede.
 * @returns {Promise<Array<Object>>} - Un array de escuelas.
 */
export const fetchEscuelasBySede = async (sedeId) => {
  try {
    const response = await api.get(`/escuela/sede/${sedeId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching escuelas for sede ${sedeId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
