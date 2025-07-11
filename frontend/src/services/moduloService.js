// src/services/moduloService.js
import api from './api'; // Tu instancia de Axios configurada

/**
 * Obtiene todos los módulos.
 * @returns {Promise<Array<Object>>} - Un array de módulos.
 */
export const fetchAllModulos = async () => {
  try {
    const response = await api.get('/modulo'); // Endpoint: GET /api/modulo
    // Verifica si response.data existe y es un array antes de devolverlo
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(
      'Error fetching todos los módulos:',
      error.response?.data || error.message
    );
    return []; // Devuelve un array vacío en caso de error para seguridad en .map() o .slice()
  }
};

/**
 * Obtiene un módulo específico por su ID.
 * (Esta función es útil si necesitas cargar detalles de un módulo por separado)
 * @param {string|number} id - El ID del módulo.
 * @returns {Promise<Object>} - El objeto del módulo.
 */
export const fetchModuloById = async (id) => {
  try {
    const response = await api.get(`/modulo/${id}`); // Endpoint: GET /api/modulo/:id
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching módulo con id ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error; // Relanzar para que el componente lo maneje
  }
};

/**
 * Crea un nuevo módulo.
 * Esta función es la que tu ModulosPage.jsx importa como 'AddModulo'.
 * @param {Object} moduloData - Los datos del módulo a crear.
 * @returns {Promise<Object>} - El módulo creado o un mensaje de éxito.
 */
export const createModulo = async (moduloData) => {
  try {
    const response = await api.post('/modulo', moduloData); // Endpoint: POST /api/modulo
    return response.data;
  } catch (error) {
    console.error(
      'Error creando módulo:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Actualiza un módulo existente.
 * Esta función es la que tu ModulosPage.jsx importa como 'EditModulo'.
 * @param {string|number} id - El ID del módulo a actualizar.
 * @param {Object} moduloData - Los nuevos datos para el módulo.
 * @returns {Promise<Object>} - La respuesta del servidor.
 */
export const updateModulo = async (id, moduloData) => {
  try {
    const response = await api.put(`/modulo/${id}`, moduloData); // Endpoint: PUT /api/modulo/:id
    return response.data;
  } catch (error) {
    console.error(
      `Error actualizando módulo ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Elimina un módulo por su ID.
 * Esta función es la que tu ModulosPage.jsx importa como 'DeleteModulo'.
 * @param {string|number} id - El ID del módulo a eliminar.
 * @returns {Promise<Object>} - La respuesta del servidor (a menudo vacía o un mensaje).
 */
export const deleteModulo = async (id) => {
  try {
    const response = await api.delete(`/modulo/${id}`); // Endpoint: DELETE /api/modulo/:id
    return response.data || { message: 'Módulo eliminado exitosamente' };
  } catch (error) {
    console.error(
      `Error eliminando módulo ${id}:`,
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

export const fetchAvailableModules = async (
  fecha,
  idSala,
  idReservaExcluir = null
) => {
  console.log('[moduloService] fetchAvailableModules llamado con:', {
    fecha,
    idSala,
    idReservaExcluir,
  });
  try {
    const params = {
      fecha_reserva: fecha,
      sala_id: idSala,
    };
    if (idReservaExcluir !== null) {
      params.reserva_id_excluir = idReservaExcluir;
    }
    const endpoint = '/modulo/disponibles'; // Corregido para coincidir con modulo.routes.js
    console.log(
      '[moduloService] Petición GET a:',
      endpoint,
      'con params:',
      params
    );

    const response = await api.get(endpoint, { params });
    console.log(
      '[moduloService] Módulos disponibles recibidos:',
      response.data
    );
    return response.data;
  } catch (error) {
    console.error('[moduloService] Error en fetchAvailableModules:', error);
    if (error.response) {
      console.error(
        '[moduloService] Error response data:',
        error.response.data
      );
      console.error(
        '[moduloService] Error response status:',
        error.response.status
      );
      console.error(
        '[moduloService] Error response headers:',
        error.response.headers
      );
    } else if (error.request) {
      console.error('[moduloService] Error request:', error.request);
    } else {
      console.error('[moduloService] Error message:', error.message);
    }
    // Lanza el error para que el catch en ReservaForm.jsx lo maneje
    throw error.response?.data || error;
  }
};
