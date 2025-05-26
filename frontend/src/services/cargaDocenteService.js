import api from './api.js';

/**
 * Envía las filas al endpoint que importa docentes o alumnos según el roleId.
 * @param {Array<Object>} rows – filas procesadas del archivo de docentes.
 * @param {number|string} roleId – ID del rol (ya no se usa en el payload, pero se mantiene por si el modal lo envía).
 * @returns {Promise<Object>}
 */
const subirUsuariosPorRol = (rows, roleId) =>
  api
    .post('/cargaDocente/docentes', { rows }) // Cambiado el endpoint y ya no se envía roleId en el payload
    .then((res) => res.data)
    .catch((err) => {
      console.error('subirUsuariosPorRol error:', err);
      throw err;
    });

export default {
  subirUsuariosPorRol,
};
