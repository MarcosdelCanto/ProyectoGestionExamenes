import api from './api'; // Asumimos que 'api.js' es tu instancia de Axios configurada

/**
 * Obtiene datos para el reporte detallado de exámenes desde la API.
 * @param {object} filters - Un objeto que contiene todos los filtros a aplicar.
 * @returns {Promise<Array<Object>>} - Una promesa que resuelve a un array con los datos del reporte.
 */
export const getReporteDetalladoExamenes = async (filters) => {
  try {
    // 1. Construye los parámetros de consulta (query params) de forma segura.
    const queryParams = new URLSearchParams(filters).toString();

    // 2. Realiza la llamada GET al endpoint correcto con los filtros.
    // La URL final será algo como: /reports/detalle-examenes?sedeId=1&fechaDesde=2025-05-01
    const response = await api.get(`/reports/detalle-examenes?${queryParams}`);

    // 3. Devuelve solo los datos, que es lo que le interesa al hook.
    return response.data;
  } catch (error) {
    // 4. Si algo falla, lo captura, lo muestra en consola y lo vuelve a lanzar.
    console.error(
      'Error al obtener el reporte detallado de exámenes:',
      error.response?.data || error.message
    );
    // Esto es crucial para que el 'custom hook' (useReportData) pueda atrapar el error
    // y mostrar un mensaje al usuario.
    throw error.response?.data || error;
  }
};

export const getReporteAlumnosReservas = async (filters) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/reports/alumnos-reservas?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching reporte de alumnos:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};

/**
 * Aquí podrías añadir más funciones para otros reportes en el futuro.
 * Cada función sería similar, apuntando a un endpoint diferente.
 * * Ejemplo:
 * export const getReporteResumenAsistencia = async (filters) => { ... };
 */
