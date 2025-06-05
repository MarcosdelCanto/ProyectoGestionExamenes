// src/services/publicService.js
import api from './api'; // Tu instancia de Axios. Nota: este 'api' usa interceptor de token.
// Para una ruta pública real, podrías necesitar una instancia de Axios separada sin interceptor,
// o que el backend ignore el token para este endpoint público específico.
// Por ahora, asumimos que el backend simplemente no lo requiere para esta ruta.

/**
 * Consulta las reservas para un usuario (alumno o docente) por su identificador.
 * @param {string} identificador - RUT o Email del usuario.
 * @param {string} tipoUsuario - 'alumno' o 'docente'.
 * @returns {Promise<Array<Object>>} - Un array de reservas.
 */
export const consultarResevaExamenes = async (identificador, tipoUsuario) => {
  try {
    // La URL completa será /api/public/consultar-reservas
    const response = await api.post('/public/consultar-reservas', {
      identificador,
      tipoUsuario,
    });
    return response.data;
  } catch (error) {
    console.error(
      'Error al consultar reservas para:',
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};
