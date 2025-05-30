import api from './api';

/**
 * Obtiene todas las secciones.
 * @returns {Promise<Array<Object>>} - Un array de secciones.
 */
export const fetchAllSecciones = async () => {
  try {
    const response = await api.get('/seccion');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching secciones:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene una sección específica por su ID.
 * @param {string|number} id - El ID de la sección.
 * @returns {Promise<Object>} - El objeto de la sección.
 */
export const fetchSeccionById = async (id) => {
  try {
    const response = await api.get(`/seccion/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching seccion with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea una nueva sección.
 * @param {Object} data - Los datos de la sección a crear.
 * @returns {Promise<Object>} - La sección creada.
 */
export const createSeccion = async (data) => {
  try {
    const response = await api.post('/seccion', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating seccion:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza una sección existente.
 * @param {string|number} id - El ID de la sección a actualizar.
 * @param {Object} data - Los nuevos datos para la sección.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateSeccion = async (id, data) => {
  try {
    const response = await api.put(`/seccion/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating seccion ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina una sección.
 * @param {string|number} id - El ID de la sección a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor (o un mensaje de éxito).
 */
export const deleteSeccion = async (id) => {
  try {
    const response = await api.delete(`/seccion/${id}`);
    return response.data; // O un mensaje/objeto de éxito si el backend lo proporciona
  } catch (error) {
    console.error(
      `Error deleting seccion ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Las funciones fetchAllAsignaturas, fetchAsignaturaById, createAsignatura, updateAsignatura, deleteAsignatura
// y AddSeccion, EditSeccion, DeleteSeccion eran incorrectas o redundantes y se han reemplazado/eliminado.
// La función fetchAllSecciones que tenías al final ya estaba bien encaminada.
