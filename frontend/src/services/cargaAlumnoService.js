import api from './api.js';
/**
 * Envía las filas al endpoint dedicado a la carga masiva de alumnos (rol 3).
 * @param {Array<Object>} rows – filas procesadas.
 * @returns {Promise<Object>}
 */
const subirAlumnos = (rows) =>
  api
    .post('/cargaAlumno/alumnos', rows)
    .then((res) => res.data)
    .catch((err) => {
      console.error('subirAlumnos error:', err);
      throw err;
    });

export default { subirAlumnos };
