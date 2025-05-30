import api from './api';

/**
 * Obtiene datos para el reporte detallado de exámenes.
 * @param {object} filters - Objeto con los filtros a aplicar.
 * @returns {Promise<Array<Object>>} - Un array con los datos del reporte.
 */
export const getReporteDetalladoExamenes = async (filters) => {
  try {
    // Construye los parámetros de consulta a partir del objeto de filtros
    const queryParams = new URLSearchParams(filters).toString();
    // Asegúrate de que la URL base sea la correcta
    const response = await api.get(`/reports/detalle-examenes?${queryParams}`); // Cambiado de /dashboard/reports a /reports
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching reporte detallado de examenes:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

// Aquí puedes añadir más funciones para otros reportes detallados
// Ejemplo:
// export const getReporteDetalladoUsoSalas = async (filters) => {
//   try {
//     const response = await api.get('/dashboard/reports/detalle-uso-salas', { params: filters });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching detailed room usage report:', error.response?.data || error.message);
//     throw error;
//   }
// };
