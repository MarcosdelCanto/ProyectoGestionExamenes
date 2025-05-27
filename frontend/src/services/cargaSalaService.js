import api from './api.js';

/**
 * Envía las filas al endpoint dedicado a la carga masiva de salas.
 * @param {Array<Object>} rows – filas procesadas.
 * @returns {Promise<Object>}
 */
const subirSalas = (rows) =>
  api
    .post('/cargaSala/salas', rows)
    .then((res) => res.data)
    .catch((err) => {
      console.error('subirSalas error:', err);
      throw err;
    });

export default { subirSalas };