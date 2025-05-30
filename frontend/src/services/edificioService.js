import api from './api';

/**
 * Obtiene todos los edificios.
 * @returns {Promise<Array<Object>>} - Un array de edificios.
 */
export const fetchAllEdificios = async () => {
  try {
    const response = await api.get('/edificio');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching edificios:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene un edificio específico por su ID.
 * @param {string|number} id - El ID del edificio.
 * @returns {Promise<Object>} - El objeto del edificio.
 */
export const fetchEdificioById = async (id) => {
  try {
    const response = await api.get(`/edificio/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching edificio with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea un nuevo edificio.
 * @param {Object} data - Los datos del edificio a crear.
 * @returns {Promise<Object>} - El edificio creado.
 */
export const createEdificio = async (data) => {
  try {
    const response = await api.post('/edificio', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating edificio:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza un edificio existente.
 * @param {string|number} id - El ID del edificio a actualizar.
 * @param {Object} data - Los nuevos datos para el edificio.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateEdificio = async (id, data) => {
  try {
    const response = await api.put(`/edificio/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating edificio ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina un edificio.
 * @param {string|number} id - El ID del edificio a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const deleteEdificio = async (id) => {
  try {
    const response = await api.delete(`/edificio/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting edificio ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Las funciones AddEdificio, EditEdificio, DeleteEdificio son redundantes y se pueden eliminar.
// La función fetchEdificiosBySede ya está correctamente implementada y se mantiene.
/**
 * Obtiene todos los edificios asociados a una sede específica.
 * Usado para los filtros dependientes en el dashboard.
 * @param {string|number} sedeId - El ID de la sede.
 * @returns {Promise<Array<Object>>} - Un array de edificios.
 */
export const fetchEdificiosBySede = async (sedeId) => {
  try {
    const response = await api.get(`/edificio/sede/${sedeId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching edificios for sede ${sedeId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
