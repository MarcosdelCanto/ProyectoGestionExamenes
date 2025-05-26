import api from './api.js';

/**
 * Envía los datos JSON procesados del archivo al backend para la carga masiva por sede.
 * @param {Array<Object>} datos – filas procesadas.
 * @param {string|number} sedeId – ID de la sede seleccionada.
 * @returns {Promise<Object>}
 */
const subirDatosCargaMasiva = (datos, sedeId) =>
  api
    .post(`/carga/${sedeId}`, datos)
    .then((res) => res.data)
    .catch((err) => {
      console.error('subirDatosCargaMasiva error:', err);
      throw err;
    });

export default {
  subirDatosCargaMasiva,
};
