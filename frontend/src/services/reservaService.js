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

/**
 * Envía una reserva al docente para su confirmación (de EN_CURSO a PENDIENTE)
 * @param {number} idReserva - ID de la reserva a enviar
 * @param {number|Object} segundoParametro - Puede ser nuevaCantidadModulos (número) o un objeto con {nuevaCantidadModulos, docente_id}
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const enviarReservaADocente = async (idReserva, segundoParametro) => {
  try {
    const payload = {};

    // Mantener compatibilidad con la llamada existente
    if (typeof segundoParametro === 'number') {
      // Llamada existente: enviarReservaADocente(reservaId, moduloscountState)
      payload.nuevaCantidadModulos = segundoParametro;
    } else if (
      typeof segundoParametro === 'object' &&
      segundoParametro !== null
    ) {
      // Nueva llamada: enviarReservaADocente(reservaId, {nuevaCantidadModulos, docente_id})
      if (segundoParametro.nuevaCantidadModulos !== undefined) {
        payload.nuevaCantidadModulos = segundoParametro.nuevaCantidadModulos;
      }
      if (segundoParametro.docente_id !== undefined) {
        payload.docente_id = segundoParametro.docente_id;
      }
    } else if (segundoParametro !== undefined) {
      // Por si acaso, tratar como módulos
      payload.nuevaCantidadModulos = segundoParametro;
    }

    console.log(
      `[reservaService] Enviando a /reserva/${idReserva}/enviar-a-docente con payload:`,
      JSON.stringify(payload)
    );

    const response = await api.put(
      `/reserva/${idReserva}/enviar-a-docente`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      '[reservaService] Error al enviar reserva a docente:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Cancela una reserva completamente, eliminándola y volviendo el examen a ACTIVO
 * @param {number} idReserva - ID de la reserva a cancelar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const cancelarReservaCompleta = async (idReserva) => {
  try {
    // Reemplazar fetch por la instancia de api
    const response = await api.delete(
      `/reserva/${idReserva}/cancelar-completa`
    );
    const data = response.data;

    // Disparar evento global para actualizar componentes
    window.dispatchEvent(
      new CustomEvent('examenesActualizados', {
        detail: {
          accion: 'reserva_cancelada',
          reservaId: idReserva,
          examenId: data.examen_id,
          timestamp: Date.now(),
        },
      })
    );

    return data;
  } catch (error) {
    console.error(
      '[reservaService] Error al cancelar reserva:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Descarta una reserva (NO la elimina, solo cambia su estado)
 * @param {number} idReserva - ID de la reserva a descartar
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const descartarReservaService = async (idReserva) => {
  try {
    // Reemplazar fetch por la instancia de api
    const response = await api.put(`/reserva/${idReserva}/descartar`);
    const data = response.data;

    // Disparar evento global para actualizar componentes
    window.dispatchEvent(
      new CustomEvent('examenesActualizados', {
        detail: {
          accion: 'reserva_descartada',
          reservaId: idReserva,
          examenId: data.examen_id,
          timestamp: Date.now(),
        },
      })
    );

    return data;
  } catch (error) {
    console.error(
      '[reservaService] Error al descartar reserva:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Crea una reserva en estado EN_CURSO (específicamente para drag & drop).
 * @param {Object} payload - Datos de la reserva
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export const crearReservaEnCursoService = async (payload) => {
  try {
    console.log('Enviando solicitud de reserva directa:', payload);

    // Usar la instancia de API configurada con los headers de autenticación
    const response = await api.post('/reserva/crear-en-curso', payload);

    const data = response.data;

    // Disparar evento para actualizar componentes (importante mantener esto)
    window.dispatchEvent(
      new CustomEvent('reservaCreada', {
        detail: {
          accion: 'reserva_creada',
          reserva: data,
          examenId: payload.examen_id_examen,
          timestamp: Date.now(),
        },
      })
    );

    console.log('Reserva creada exitosamente:', data);
    return data;
  } catch (error) {
    console.error(
      '[reservaService] Error al crear reserva en curso:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};
