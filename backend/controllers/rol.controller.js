// controllers/rol.controller.js
import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, ':', error);
  const details =
    error && error.message
      ? error.message
      : error
        ? String(error) // Si error no tiene .message pero existe, lo convertimos a String
        : 'No hay detalles adicionales del error.'; // Si error es null o undefined
  res.status(statusCode).json({ error: message, details: details });
};

/**
 * Controlador para obtener todos los roles.
 */
export const fetchAllRoles = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_ROL, NOMBRE_ROL FROM ADMIN.ROL ORDER BY NOMBRE_ROL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    handleError(res, err, 'No se pudieron obtener los roles.');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión en fetchAllRoles:', closeErr);
      }
    }
  }
};

/**
 * Controlador para obtener un rol por su ID, incluyendo sus permisos.
 */
export const getRoleById = async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return handleError(res, null, 'ID de Rol inválido.', 400);
  }
  let conn;
  try {
    conn = await getConnection();
    const roleResult = await conn.execute(
      `SELECT ID_ROL, NOMBRE_ROL FROM ADMIN.ROL WHERE ID_ROL = :roleIdBind`,
      { roleIdBind: roleId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (roleResult.rows.length === 0) {
      return handleError(res, null, 'Rol no encontrado.', 404);
    }
    const roleData = roleResult.rows[0];

    const permisosResult = await conn.execute(
      `SELECT P.ID_PERMISO, P.NOMBRE_PERMISO, P.DESCRIPCION_PERMISO
       FROM ADMIN.PERMISOSROL PR
       JOIN ADMIN.PERMISOS P ON PR.ID_PERMISO = P.ID_PERMISO
       WHERE PR.ID_ROL = :roleIdBind
       ORDER BY P.NOMBRE_PERMISO`, // Ordenar permisos para consistencia
      { roleIdBind: roleId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    roleData.permisos = permisosResult.rows;
    res.json(roleData);
  } catch (err) {
    handleError(res, err, 'No se pudo obtener el rol.');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión en getRoleById:', closeErr);
      }
    }
  }
};

/**
 * Controlador para crear un nuevo rol y asignarle permisos.
 */
export const createRole = async (req, res) => {
  const { NOMBRE_ROL, permisos } = req.body; // permisos es un array de ID_PERMISO
  let conn;

  if (!NOMBRE_ROL || NOMBRE_ROL.trim() === '') {
    return handleError(res, null, 'El nombre del rol es obligatorio.', 400);
  }

  try {
    conn = await getConnection();
    // La transacción comienza implícitamente con autoCommit = false (default del pool)
    // No es necesario conn.execute('BEGIN');

    const resultRole = await conn.execute(
      `INSERT INTO ADMIN.ROL (ID_ROL, NOMBRE_ROL)
       VALUES (SEQ_ROL.NEXTVAL, :nombre_rol_param)
       RETURNING ID_ROL INTO :newId_param`,
      {
        nombre_rol_param: NOMBRE_ROL,
        newId_param: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
      // No autoCommit aquí, es parte de la transacción
    );
    const newRoleId = resultRole.outBinds.newId_param[0];

    if (Array.isArray(permisos) && permisos.length > 0) {
      const permisosBinds = permisos.map((idPermiso) => ({
        idRol_param: newRoleId,
        idPermiso_param: parseInt(idPermiso), // Asegurar que sea número
      }));
      // Asegúrate que las columnas en PERMISOSROL sean ID_ROL, ID_PERMISO
      await conn.executeMany(
        `INSERT INTO ADMIN.PERMISOSROL (ID_ROL, ID_PERMISO) VALUES (:idRol_param, :idPermiso_param)`,
        permisosBinds
      );
    }

    await conn.commit(); // Confirmar transacción
    // Devolver el rol creado con el formato que espera el frontend (incluyendo los permisos enviados)
    res.status(201).json({
      ID_ROL: newRoleId,
      NOMBRE_ROL,
      permisos: permisos.map((id) => ({ ID_PERMISO: id })), // Simular estructura de permisos para la respuesta
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error(
          'Error ejecutando rollback en createRole:',
          rollbackError
        );
      }
    }
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return handleError(
        res,
        err,
        `El rol con nombre '${NOMBRE_ROL}' ya existe.`,
        409
      );
    }
    handleError(res, err, 'No se pudo crear el rol.');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión en createRole:', closeErr);
      }
    }
  }
};

/**
 * Controlador para actualizar un rol existente y sus permisos.
 */
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);
  const { NOMBRE_ROL, permisos } = req.body;
  let conn;

  if (isNaN(roleId)) {
    return handleError(res, null, 'ID de Rol inválido para actualizar.', 400);
  }
  if (!NOMBRE_ROL || NOMBRE_ROL.trim() === '') {
    return handleError(res, null, 'El nombre del rol es obligatorio.', 400);
  }

  try {
    conn = await getConnection();
    // La transacción comienza implícitamente

    const resultUpdate = await conn.execute(
      `UPDATE ADMIN.ROL SET NOMBRE_ROL = :nombre_rol_param WHERE ID_ROL = :roleId_param`,
      { roleId_param: roleId, nombre_rol_param: NOMBRE_ROL }
    );

    if (resultUpdate.rowsAffected === 0) {
      return handleError(res, null, 'Rol no encontrado para actualizar.', 404);
    }

    await conn.execute(
      `DELETE FROM ADMIN.PERMISOSROL WHERE ID_ROL = :roleId_param`,
      { roleId_param: roleId }
    );

    if (Array.isArray(permisos) && permisos.length > 0) {
      const permisosBinds = permisos.map((idPermiso) => ({
        idRol_param: roleId,
        idPermiso_param: parseInt(idPermiso), // Asegurar que sea número
      }));
      await conn.executeMany(
        `INSERT INTO ADMIN.PERMISOSROL (ID_ROL, ID_PERMISO) VALUES (:idRol_param, :idPermiso_param)`,
        permisosBinds
      );
    }

    await conn.commit();
    res.status(200).json({
      message: 'Rol actualizado exitosamente.',
      ID_ROL: roleId,
      NOMBRE_ROL,
      // Devolver los permisos actualizados para que el frontend pueda reflejarlo si es necesario
      permisos: permisos.map((id) => ({ ID_PERMISO: id })), // Simular estructura de permisos
    });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error(
          'Error ejecutando rollback en updateRole:',
          rollbackError
        );
      }
    }
    if (err.errorNum === 1) {
      return handleError(
        res,
        err,
        `El nombre de rol '${NOMBRE_ROL}' ya está en uso por otro rol.`,
        409
      );
    }
    handleError(res, err, 'No se pudo actualizar el rol.');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando la conexión en updateRole:', closeErr);
      }
    }
  }
};

/**
 * Controlador para eliminar un rol por su ID.
 */
export const deleteRole = async (req, res) => {
  const { id } = req.params;
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return handleError(res, null, 'ID de Rol inválido para eliminar.', 400);
  }
  let conn;
  try {
    conn = await getConnection();
    // La transacción comienza implícitamente

    // Primero eliminar de PERMISOSROL (tabla hija)
    await conn.execute(
      `DELETE FROM ADMIN.PERMISOSROL WHERE ID_ROL = :roleId_param`,
      { roleId_param: roleId }
    );

    // Luego eliminar de ROL (tabla padre)
    const resultDelete = await conn.execute(
      `DELETE FROM ADMIN.ROL WHERE ID_ROL = :roleId_param`,
      { roleId_param: roleId }
    );

    if (resultDelete.rowsAffected === 0) {
      // Si no se afectó ROL, el rol no existía. Rollback no es estrictamente necesario aquí
      // si la eliminación de PERMISOSROL no debe revertirse, pero por consistencia lo mantenemos.
      if (conn) {
        try {
          await conn.rollback();
        } catch (e) {
          console.error('Rollback innecesario falló:', e);
        }
      }
      return handleError(res, null, 'Rol no encontrado para eliminar.', 404);
    }

    await conn.commit();
    res.status(200).json({ message: 'Rol eliminado exitosamente.' });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error(
          'Error ejecutando rollback en deleteRole:',
          rollbackError
        );
      }
    }
    if (err.errorNum === 2292) {
      // ORA-02292: integrity constraint violated - child record found
      return handleError(
        res,
        err,
        'No se puede eliminar el rol porque está asignado a uno o más usuarios.',
        409
      );
    }
    handleError(res, err, 'No se pudo eliminar el rol.');
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando la conexión en deleteRole:', closeErr);
      }
    }
  }
};
