import api from './api'; // Tu instancia configurada de Axios

/**
 * Obtiene todas las reservas.
 * @param {object} params - Opcional: objeto con parámetros de query para filtrar (ej. { fecha_desde: 'YYYY-MM-DD' })
 * @returns {Promise<Array<Object>>} - Un array de reservas.
 */
export const fetchAllReservas = async (params) => {
  try {
    const response = await api.get('/reserva', { params });
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching reservas:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Obtiene una reserva específica por su ID.
 * @param {string|number} id - El ID de la reserva.
 * @returns {Promise<Object>} - El objeto de la reserva (incluyendo módulos).
 */
export const fetchReservaById = async (id) => {
  try {
    const response = await api.get(`/reserva/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching reserva with id ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Crea una nueva reserva.
 * @param {Object} data - Los datos de la reserva a crear.
 *   Ej: { fecha_reserva, examen_id_examen, sala_id_sala, estado_id_estado, modulos: [id1, id2] }
 * @returns {Promise<Object>} - La reserva creada o un mensaje de éxito.
 */
export const createReserva = async (data) => {
  try {
    const response = await api.post('/reserva', data);
    return response.data;
  } catch (error) {
    console.error(
      'Error creating reserva:',
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza una reserva existente.
 * @param {string|number} id - El ID de la reserva a actualizar.
 * @param {Object} data - Los nuevos datos para la reserva.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateReserva = async (id, data) => {
  try {
    const response = await api.put(`/reserva/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating reserva ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Elimina (cancela) una reserva.
 * @param {string|number} id - El ID de la reserva a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const deleteReserva = async (id) => {
  try {
    const response = await api.delete(`/reserva/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting reserva ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};
