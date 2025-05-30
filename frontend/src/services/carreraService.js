import api from './api';

/**
 * Obtiene todas las carreras.
 * @returns {Promise<Array<Object>>} - Un array de carreras.
 */
export const fetchAllCarreras = async () => {
  try {
    const response = await api.get('/carrera');
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching carreras:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene una carrera específica por su ID.
 * @param {string|number} id - El ID de la carrera.
 * @returns {Promise<Object>} - El objeto de la carrera.
 */
export const fetchCarreraById = async (id) => {
  try {
    const response = await api.get(`/carrera/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching carrera with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea una nueva carrera.
 * @param {Object} data - Los datos de la carrera a crear.
 * @returns {Promise<Object>} - La carrera creada.
 */
export const createCarrera = async (data) => {
  try {
    const response = await api.post('/carrera', data); // Asegúrate que el endpoint no necesite una barra al final si 'data' es el cuerpo
    return response.data;
  } catch (error) {
    console.error(
      'Error creating carrera:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza una carrera existente.
 * @param {string|number} id - El ID de la carrera a actualizar.
 * @param {Object} data - Los nuevos datos para la carrera.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateCarrera = async (id, data) => {
  try {
    const response = await api.put(`/carrera/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating carrera ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina una carrera.
 * @param {string|number} id - El ID de la carrera a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor (o un mensaje de éxito).
 */
export const deleteCarrera = async (id) => {
  try {
    const response = await api.delete(`/carrera/${id}`);
    return response.data; // O un mensaje/objeto de éxito si el backend lo proporciona
  } catch (error) {
    console.error(
      `Error deleting carrera ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene todas las carreras asociadas a una escuela específica.
 * Usado para los filtros dependientes en el dashboard.
 * @param {string|number} escuelaId - El ID de la escuela.
 * @returns {Promise<Array<Object>>} - Un array de carreras.
 */
export const fetchCarrerasByEscuela = async (escuelaId) => {
  try {
    const response = await api.get(`/carrera/escuela/${escuelaId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching carreras for escuela ${escuelaId}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Las funciones AddCarrera, EditCarrera, DeleteCarrera eran redundantes
// y las versiones más cortas de create/update/deleteCarrera no tenían manejo de errores explícito.
// Se han unificado para mayor claridad y consistencia.
