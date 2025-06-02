import { getConnection } from '../db.js'; // Ajusta la ruta a tu archivo db.js
import oracledb from 'oracledb';

/**
 * Middleware factory para verificar permisos.
 * @param {string[]} requiredPermissions - Un array de strings con los NOMBRE_PERMISO requeridos.
 * El usuario debe tener AL MENOS UNO de estos permisos para pasar.
 */
export const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    // Asumimos que authMiddleware ya ha puesto req.user con req.user.rol_id_rol
    if (!req.user || typeof req.user.rol_id_rol === 'undefined') {
      // Esto no debería pasar si authMiddleware se ejecuta primero
      return res
        .status(401)
        .json({ error: 'Usuario no autenticado o rol no disponible.' });
    }

    // Si no se requieren permisos específicos para esta ruta (más allá de la autenticación), permite el paso.
    // Podrías cambiar esto para que siempre se requiera al menos un permiso si lo prefieres.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }

    let connection;
    try {
      connection = await getConnection();
      const rolId = req.user.rol_id_rol;

      // Consulta para obtener todos los permisos asociados al ROL del usuario
      const sql = `
        SELECT P.NOMBRE_PERMISO
        FROM PERMISOSROL PR
        JOIN PERMISOS P ON PR.ID_PERMISO = P.ID_PERMISO
        WHERE PR.ID_ROL = :rolIdBind
      `;
      const result = await connection.execute(
        sql,
        { rolIdBind: rolId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const userPermissions = result.rows.map((p) => p.NOMBRE_PERMISO);

      // Verificar si el usuario tiene AL MENOS UNO de los permisos requeridos
      const hasRequiredPermission = requiredPermissions.some((requiredPerm) =>
        userPermissions.includes(requiredPerm)
      );

      if (hasRequiredPermission) {
        next(); // El usuario tiene el permiso, continuar al controlador
      } else {
        // El usuario no tiene ninguno de los permisos requeridos
        res
          .status(403)
          .json({
            error: 'Acceso denegado. No tienes los permisos necesarios.',
          });
      }
    } catch (error) {
      console.error('Error en el middleware de permisos:', error);
      res
        .status(500)
        .json({ error: 'Error interno del servidor al verificar permisos.' });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(
            'Error cerrando conexión en middleware de permisos:',
            err
          );
        }
      }
    }
  };
};
