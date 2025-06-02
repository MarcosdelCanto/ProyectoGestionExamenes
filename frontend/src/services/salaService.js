// src/services/salaService.js
import api from './api'; // Tu instancia de Axios configurada

/**
 * Obtiene todas las salas.
 * @returns {Promise<Array<Object>>} - Un array de salas.
 */
export const fetchAllSalas = async () => {
  try {
    const response = await api.get('/sala'); // Endpoint: GET /api/sala
    // Verifica si la respuesta tiene datos y si es un array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(
      'Error fetching todas las salas:',
      error.response?.data || error.message
    );
    // Devolver un array vacío permite que el .map() o .slice() en el frontend no fallen
    // El componente puede verificar si el array está vacío para mostrar un mensaje.
    return [];
  }
};

/**
 * Obtiene una sala específica por su ID.
 * @param {string|number} id - El ID de la sala.
 * @returns {Promise<Object>} - El objeto de la sala.
 */
export const fetchSalaById = async (id) => {
  try {
    const response = await api.get(`/sala/${id}`); // Endpoint: GET /api/sala/:id
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching sala con id ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error; // Relanzar para que el componente lo maneje
  }
};

/**
 * Crea una nueva sala.
 * Reemplaza tu función 'AddSala' y la 'createSala' concisa.
 * @param {Object} salaData - Los datos de la sala a crear.
 * @returns {Promise<Object>} - La sala creada o un mensaje de éxito.
 */
export const createSala = async (salaData) => {
  try {
    const response = await api.post('/sala', salaData); // Endpoint: POST /api/sala
    return response.data; // Usualmente el backend devuelve el objeto creado o un mensaje
  } catch (error) {
    console.error(
      'Error creating sala:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Actualiza una sala existente.
 * Reemplaza tu función 'EditSala' y la 'updateSala' concisa.
 * @param {string|number} id - El ID de la sala a actualizar.
 * @param {Object} salaData - Los nuevos datos para la sala.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateSala = async (id, salaData) => {
  try {
    const response = await api.put(`/sala/${id}`, salaData); // Endpoint: PUT /api/sala/:id
    return response.data;
  } catch (error) {
    console.error(
      `Error updating sala ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Elimina una sala por su ID.
 * Reemplaza tu función 'DeleteSala' y la 'deleteSala' concisa.
 * (Usando 'deleteSalaById' porque así la importaste en SalasPage.jsx antes)
 * @param {string|number} id - El ID de la sala a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor (a menudo vacía o un mensaje).
 */
export const deleteSalaById = async (id) => {
  try {
    const response = await api.delete(`/sala/${id}`); // Endpoint: DELETE /api/sala/:id
    // DELETE puede no devolver contenido en response.data (ej. status 204)
    return response.data || { message: 'Sala eliminada exitosamente' };
  } catch (error) {
    console.error(
      `Error deleting sala ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};
