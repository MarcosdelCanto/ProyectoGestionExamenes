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
 * Crea una reserva completa (Reserva + ReservaModulos) para un examen existente.
 * @param {object} payload - Datos de la reserva: { examen_id_examen, fecha_reserva, sala_id_sala, modulos_ids, estado_id_estado_reserva }
 * @returns {Promise<object>} - Respuesta del servidor.
 */
export const crearReservaParaExamenExistenteService = async (payload) => {
  // Asegurarse que el nombre es el que se exporta
  try {
    // Usaremos un endpoint nuevo o ajustaremos el existente.
    // Si ajustas el existente, asegúrate que el backend sepa que no debe crear un examen.
    const response = await api.post(
      '/reserva/crear-para-examen-existente',
      payload
    );
    return response.data;
  } catch (error) {
    console.error(
      'Error al crear la reserva para examen existente:',
      error.response?.data || error.message
    );
    const customError = new Error(
      error.response?.data?.message || error.response?.data || error.message
    );
    customError.details = error.response?.data?.details;
    customError.status = error.response?.status;
    throw customError;
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
    console.log(
      `[reservaService] updateReserva llamado. ID: ${id}, Data:`,
      data
    ); // Log para verificar
    const response = await api.put(`/reserva/actualizar/${id}`, data);
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

/**
 * Obtiene las reservas pendientes de confirmación para el docente autenticado.
 */
export const getMisReservasPendientesDocente = async () => {
  try {
    const response = await api.get('/reserva/docente/pendientes'); // Endpoint del backend
    return response.data;
  } catch (error) {
    console.error(
      'Error al obtener reservas pendientes del docente:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Actualiza el estado de confirmación de una reserva por parte del docente.
 * @param {string|number} idReserva - El ID de la reserva a actualizar.
 * @param {object} datosConfirmacion - Objeto con { nuevoEstado, observaciones }
 * @returns {Promise<object>} - Respuesta del servidor.
 */
export const actualizarConfirmacionReservaDocente = async (
  idReserva,
  datosConfirmacion
) => {
  try {
    const response = await api.put(
      `/reserva/${idReserva}/docente/confirmacion`,
      datosConfirmacion
    ); // Endpoint del backend
    return response.data;
  } catch (error) {
    console.error(
      `Error al actualizar confirmación para reserva ${idReserva}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

export const fetchMisAsignacionesDeReservas = async () => {
  try {
    const response = await api.get('/reserva/mis-asignaciones'); // Llama al nuevo endpoint
    return response.data;
  } catch (error) {
    console.error(
      'Error al obtener mis asignaciones de reservas:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

// ... otras funciones de servicio de reservas que puedas tener

export const descartarReserva = async (idReserva) => {
  try {
    const response = await api.put(`/reserva/${idReserva}/descartar`);
    return response.data;
  } catch (error) {
    console.error(
      `Error al descartar la reserva ${idReserva}:`,
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        error: 'Error de red o servidor',
        details: error.message,
      }
    );
  }
};

/**
 * Crea una reserva completa para un examen existente con estado inicial EN_CURSO.
 * Esta función se usa principalmente para drag & drop en el calendario.
 * @param {object} payload - Datos de la reserva: { examen_id_examen, fecha_reserva, sala_id_sala, modulos_ids, docente_ids }
 * @returns {Promise<object>} - Respuesta del servidor.
 */
export const crearReservaEnCursoService = async (payload) => {
  try {
    console.log('[crearReservaEnCursoService] Enviando datos:', payload);

    const response = await api.post('/reserva/crear-en-curso', payload);

    console.log(
      '[crearReservaEnCursoService] Respuesta exitosa:',
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      '[crearReservaEnCursoService] Error al crear la reserva en curso:',
      error.response?.data || error.message
    );

    const customError = new Error(
      error.response?.data?.message || error.response?.data || error.message
    );
    customError.details = error.response?.data?.details;
    customError.status = error.response?.status;
    throw customError;
  }
};

/**
 * Cambia el estado de confirmación docente de EN_CURSO a PENDIENTE
 * @param {number} reservaId - ID de la reserva
 * @returns {Promise<object>} - Respuesta del servidor
 */
export const enviarReservaADocente = async (reservaId) => {
  try {
    console.log(
      `[enviarReservaADocente] Enviando reserva ${reservaId} a docente`
    );

    const response = await api.put(`/reserva/${reservaId}/enviar-a-docente`);

    console.log('[enviarReservaADocente] Respuesta exitosa:', response.data);

    return response.data;
  } catch (error) {
    console.error(
      '[enviarReservaADocente] Error al enviar reserva a docente:',
      error.response?.data || error.message
    );

    const customError = new Error(
      error.response?.data?.message || error.response?.data || error.message
    );
    customError.details = error.response?.data?.details;
    customError.status = error.response?.status;
    throw customError;
  }
};

/**
 * Cancela una reserva y vuelve el examen a estado ACTIVO
 * @param {number} reservaId - ID de la reserva
 * @returns {Promise<object>} - Respuesta del servidor
 */
export const cancelarReservaCompleta = async (reservaId) => {
  try {
    console.log(`[cancelarReservaCompleta] Cancelando reserva ${reservaId}`);

    const response = await api.delete(
      `/reserva/${reservaId}/cancelar-completa`
    );

    console.log('[cancelarReservaCompleta] Respuesta exitosa:', response.data);

    return response.data;
  } catch (error) {
    console.error(
      '[cancelarReservaCompleta] Error al cancelar reserva:',
      error.response?.data || error.message
    );

    const customError = new Error(
      error.response?.data?.message || error.response?.data || error.message
    );
    customError.details = error.response?.data?.details;
    customError.status = error.response?.status;
    throw customError;
  }
};
