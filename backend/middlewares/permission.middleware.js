// middlewares/permission.middleware.js

import { getConnection } from '../db.js'; // Ajusta la ruta a tu archivo db.js
import oracledb from 'oracledb';

/**
 * Middleware factory para verificar permisos.
 * @param {string|string[]} requiredPermissions - Un string o un array de strings con los NOMBRE_PERMISO requeridos.
 * El usuario debe tener AL MENOS UNO de estos permisos para pasar.
 */
export const checkPermission = (requiredPermissions) => {
  // 1. Convertir requiredPermissions a un array si no lo es.
  // Esto asegura que el método .some() siempre pueda ser llamado.
  const permissionsArray = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  // 2. Filtrar cualquier valor null, undefined o cadena vacía que pueda haber en el array de permisos.
  // Esto hace la validación más robusta.
  const cleanedPermissions = permissionsArray.filter(
    (perm) => perm && perm.trim() !== ''
  );

  // Esta es la función middleware que Express usará
  return async (req, res, next) => {
    console.log(
      '[permissionMiddleware] Entrando. req.user recibido:',
      req.user
    );
    console.log(
      '[permissionMiddleware] Path de la petición actual:',
      req.originalUrl
    );
    console.log(
      '[permissionMiddleware] Permisos requeridos para esta ruta (limpios):',
      cleanedPermissions
    );

    // Verifica si req.user y req.user.rol_id_rol están definidos
    if (!req.user || typeof req.user.rol_id_rol === 'undefined') {
      console.error(
        '[permissionMiddleware] FALLO INICIAL: req.user o req.user.rol_id_rol no definidos.'
      );
      return res.status(401).json({
        error:
          'Middleware de Permisos: Usuario no autenticado o rol no disponible.',
      });
    }

    const rolId = req.user.rol_id_rol;
    console.log(`[permissionMiddleware] rol_id_rol del usuario: ${rolId}`);

    // Si no se requieren permisos específicos (después de la limpieza), permite el paso.
    if (cleanedPermissions.length === 0) {
      console.log(
        '[permissionMiddleware] No se requieren permisos específicos para esta ruta. Pasando al siguiente manejador...'
      );
      return next();
    }

    let connection;
    try {
      console.log(
        `[permissionMiddleware] Conectando a la BD para verificar permisos del rol: ${rolId}`
      );
      connection = await getConnection();

      // Consulta para obtener todos los permisos asociados al ROL del usuario
      const sql = `
        SELECT P.NOMBRE_PERMISO
        FROM ADMIN.PERMISOSROL PR
        JOIN ADMIN.PERMISOS P ON PR.ID_PERMISO = P.ID_PERMISO
        WHERE PR.ID_ROL = :rolIdBind
      `;
      const result = await connection.execute(
        sql,
        { rolIdBind: rolId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const userPermissions = result.rows.map((p) => p.NOMBRE_PERMISO);
      console.log(
        `[permissionMiddleware] Permisos encontrados para el rol ${rolId}:`,
        userPermissions
      );

      // 3. Verificar si el usuario tiene AL MENOS UNO de los permisos requeridos
      // Se utiliza 'cleanedPermissions' para garantizar que es un array.
      const hasRequiredPermission = cleanedPermissions.some((requiredPerm) =>
        userPermissions.includes(requiredPerm)
      );

      if (hasRequiredPermission) {
        console.log(
          '[permissionMiddleware] Usuario TIENE el permiso requerido. Llamando a next(). req.user actual:',
          req.user
        );
        next(); // El usuario tiene el permiso, continuar al controlador
      } else {
        console.log(
          `[permissionMiddleware] Usuario con rol ${rolId} NO TIENE NINGUNO de los permisos requeridos (${cleanedPermissions.join(', ')}). Permisos del usuario: ${userPermissions.join(', ')}`
        );
        res.status(403).json({
          error:
            'Acceso denegado. No tienes los permisos necesarios para esta acción.',
        });
      }
    } catch (error) {
      console.error(
        '[permissionMiddleware] Error durante la verificación de permisos en BD:',
        error
      );
      res
        .status(500)
        .json({ error: 'Error interno del servidor al verificar permisos.' });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error(
            '[permissionMiddleware] Error cerrando conexión en middleware de permisos:',
            err
          );
        }
      }
    }
  };
};
