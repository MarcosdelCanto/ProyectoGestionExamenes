// controllers/user.controller.js
import { getConnection } from '../db.js';
import bcrypt from 'bcrypt'; // Importar bcrypt
import oracledb from 'oracledb';

const handleError = (res, error, message) => {
  console.error(message, ':', error);
  res.status(500).json({ error: message, details: error.message });
};

/**
 * Elimina un usuario por su ID, incluyendo sus asociaciones en USUARIOCARRERA, USUARIOSECCION y RESERVA_DOCENTES.
 * @param {object} req - Objeto de solicitud con parámetros de ruta (id del usuario).
 * @param {object} res - Objeto de respuesta.
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params; // ID del usuario a eliminar
  let conn;

  try {
    conn = await getConnection();

    // 1. Eliminar asociaciones en ADMIN.USUARIOCARRERA
    console.log(
      `Intentando eliminar asociaciones de ADMIN.USUARIOCARRERA para el usuario ID: ${id}`
    );
    await conn.execute(
      `DELETE FROM ADMIN.USUARIOCARRERA WHERE USUARIO_ID_USUARIO = :userId`,
      { userId: id },
      { autoCommit: false }
    );

    // 2. Eliminar asociaciones en ADMIN.USUARIOSECCION
    console.log(
      `Intentando eliminar asociaciones de ADMIN.USUARIOSECCION para el usuario ID: ${id}`
    );
    await conn.execute(
      `DELETE FROM ADMIN.USUARIOSECCION WHERE USUARIO_ID_USUARIO = :userId`,
      { userId: id },
      { autoCommit: false }
    );

    // 3. ¡NUEVO! Eliminar asociaciones en ADMIN.RESERVA_DOCENTES
    console.log(
      `Intentando eliminar asociaciones de ADMIN.RESERVA_DOCENTES para el usuario ID: ${id}`
    );
    await conn.execute(
      `DELETE FROM ADMIN.RESERVA_DOCENTES WHERE USUARIO_ID_USUARIO = :userId`, // Asume que la FK se llama USUARIO_ID_USUARIO
      { userId: id },
      { autoCommit: false }
    );

    // 4. Eliminar el usuario de la tabla ADMIN.USUARIO
    console.log(`Intentando eliminar el USUARIO con ID: ${id}`);
    const deleteUserResult = await conn.execute(
      `DELETE FROM ADMIN.USUARIO WHERE ID_USUARIO = :userId`,
      { userId: id },
      { autoCommit: false }
    );

    if (deleteUserResult.rowsAffected === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ error: 'Usuario no encontrado para eliminar.' });
    }

    await conn.commit();
    console.log(
      `Usuario ID: ${id} y sus asociaciones eliminadas exitosamente.`
    );
    res
      .status(200)
      .json({ message: 'Usuario y sus asociaciones eliminadas exitosamente.' });
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
        console.log('Rollback exitoso.');
      } catch (rollbackErr) {
        console.error('Error durante el rollback:', rollbackErr);
      }
    }
    console.error('Error al eliminar usuario y sus asociaciones:', err);
    res
      .status(500)
      .json({
        error:
          'Error interno del servidor al eliminar usuario y sus asociaciones.',
        details: err.message,
      });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error('Error cerrando conexión:', closeErr);
      }
    }
  }
};

/**
 * Elimina múltiples usuarios por sus IDs, incluyendo sus asociaciones.
 * Espera un array de IDs de usuario en el cuerpo de la solicitud (req.body.ids).
 * Realiza la operación dentro de una única transacción.
 * @param {object} req - Objeto de solicitud con el cuerpo (ej. { ids: [1, 2, 3] }).
 * @param {object} res - Objeto de respuesta.
 */
export const deleteMultipleUsers = async (req, res) => {
  const { ids } = req.body;
  let conn;
  let deletedCount = 0;
  let failedDeletions = [];

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({
        error:
          'Se requiere un array de IDs de usuario para la eliminación masiva.',
      });
  }

  try {
    conn = await getConnection();

    for (const id of ids) {
      try {
        // Eliminar asociaciones en USUARIOCARRERA
        await conn.execute(
          `DELETE FROM ADMIN.USUARIOCARRERA WHERE USUARIO_ID_USUARIO = :userId`,
          { userId: id },
          { autoCommit: false }
        );

        // Eliminar asociaciones en USUARIOSECCION
        await conn.execute(
          `DELETE FROM ADMIN.USUARIOSECCION WHERE USUARIO_ID_USUARIO = :userId`,
          { userId: id },
          { autoCommit: false }
        );

        // ¡NUEVO! Eliminar asociaciones en ADMIN.RESERVA_DOCENTES
        await conn.execute(
          `DELETE FROM ADMIN.RESERVA_DOCENTES WHERE USUARIO_ID_USUARIO = :userId`, // Asume que la FK se llama USUARIO_ID_USUARIO
          { userId: id },
          { autoCommit: false }
        );

        // Eliminar el usuario
        const deleteUserResult = await conn.execute(
          `DELETE FROM ADMIN.USUARIO WHERE ID_USUARIO = :userId`,
          { userId: id },
          { autoCommit: false }
        );

        if (deleteUserResult.rowsAffected > 0) {
          deletedCount++;
          console.log(`Usuario ID: ${id} y sus asociaciones eliminadas.`);
        } else {
          failedDeletions.push({ id, reason: 'No encontrado.' });
          console.log(`Usuario ID: ${id} no encontrado para eliminar.`);
        }
      } catch (innerErr) {
        failedDeletions.push({ id, reason: innerErr.message });
        console.error(`Error al eliminar usuario ID: ${id}:`, innerErr);
      }
    }

    await conn.commit();

    if (failedDeletions.length === ids.length) {
      return res.status(500).json({
        message: 'No se pudo eliminar ningún usuario de la selección.',
        details: failedDeletions,
      });
    } else if (failedDeletions.length > 0) {
      return res.status(200).json({
        message: `Operación de eliminación masiva completada. ${deletedCount} usuarios eliminados, ${failedDeletions.length} fallaron.`,
        details: failedDeletions,
      });
    } else {
      return res.status(200).json({
        message: `${deletedCount} usuarios eliminados exitosamente.`,
      });
    }
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
        console.log('Rollback exitoso para la eliminación masiva.');
      } catch (rollbackErr) {
        console.error(
          'Error durante el rollback de eliminación masiva:',
          rollbackErr
        );
      }
    }
    console.error('Error general en la eliminación masiva de usuarios:', err);
    return res.status(500).json({
      error:
        'Error interno del servidor durante la eliminación masiva de usuarios.',
      details: err.message,
    });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error(
          'Error cerrando conexión en eliminación masiva:',
          closeErr
        );
      }
    }
  }
};

/**
 * Importa o actualiza usuarios desde un array de filas:
 * - Si ID_DOCENTE ya existe, actualiza EMAIL_USUARIO y fecha_actu_usuario.
 * - Si no existe, inserta un nuevo registro con PASSWORD_USUARIO = ID_DOCENTE y ROL_ID_ROL = 2.
 */
export const importUsuarios = async (req, res) => {
  const { rows, roleId } = req.body;
  let conn;
  let insertedCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;

  try {
    conn = await getConnection();

    const saltRounds = 10; // Para bcrypt

    if (roleId === 2) {
      // lógica para docentes (ID Docente)… (ya existente)
      for (const fila of rows) {
        const idDocente = String(fila['ID Docente'] ?? '').trim();
        const nombre =
          String(fila['Nombre Docente'] ?? '').trim() || 'Sin Nombre';
        const email = String(fila['Mail Duoc'] ?? '').trim();

        if (!idDocente) {
          ignoredCount++;
          continue;
        }

        // 1) ¿Ya existe?
        const sel = await conn.execute(
          `SELECT ID_USUARIO
             FROM USUARIO
            WHERE ID_DOCENTE = :idDocente`,
          { idDocente },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (sel.rows.length) {
          // actualizar sólo si hay correo válido
          if (email) {
            await conn.execute(
              `UPDATE USUARIO
                  SET EMAIL_USUARIO     = :email,
                      FECHA_ACTU_USUARIO = SYSDATE
                WHERE ID_DOCENTE = :idDocente`,
              { email, idDocente }
            );
            updatedCount++;
          }
        } else {
          const hashedPassword = await bcrypt.hash(idDocente, saltRounds);
          // 2b) Insertar nuevo usuario
          await conn.execute(
            `INSERT INTO USUARIO (
                 ID_USUARIO,
                 NOMBRE_USUARIO,
                 EMAIL_USUARIO,
                 PASSWORD_USUARIO,
                 FECHA_CREA_USUARIO,
                 FECHA_ACTU_USUARIO,
                 ROL_ID_ROL,
                 ID_DOCENTE
               ) VALUES (
                 SEQ_USUARIO.NEXTVAL,
                 :nombre,
                 :email,
                 :password,
                 SYSDATE,
                 NULL,
                 2,
                 :idDocente
               )`,
            {
              nombre,
              email,
              password: hashedPassword, // Usar contraseña hasheada
              idDocente,
            }
          );
          insertedCount++;
        }
      }
    } else if (roleId === 3) {
      // lógica para alumnos
      for (const fila of rows) {
        const rawName = String(fila['Nombre partic.'] ?? '').trim();
        if (!rawName) {
          ignoredCount++;
          continue;
        }
        // "apellido, nombre" → "nombreapellido"
        const [apellido = '', nombre = ''] = rawName.split(',');
        // Considerar un espacio entre nombre y apellido si es deseado
        // const nombreUsuario = `${nombre.trim()} ${apellido.trim()}`.trim();
        const nombreUsuario = nombre.trim() + apellido.trim();
        const email = String(fila['Mail'] ?? '').trim();
        const password = String(fila['Abrev.participante'] ?? '').trim();
        // insertar siempre
        await conn.execute(
          `INSERT INTO USUARIO (
               ID_USUARIO,
               NOMBRE_USUARIO,
               EMAIL_USUARIO,
               PASSWORD_USUARIO,
               FECHA_CREA_USUARIO,
               FECHA_ACTU_USUARIO,
               ROL_ID_ROL
             ) VALUES (
               SEQ_USUARIO.NEXTVAL,
               :nombreUsuario,
               :email,
               :password,
               SYSDATE,
               SYSDATE,
               3
             )`, // Considerar hashear la contraseña aquí también
          {
            nombreUsuario,
            email,
            password: await bcrypt.hash(password, saltRounds),
          }
        );
        insertedCount++;
      }
    } else {
      return res
        .status(400)
        .json({ error: 'Rol no soportado para importación.' });
    }

    await conn.commit();
    return res.json({
      message: 'Proceso de importación de usuarios completado.',
      inserted: insertedCount,
      updated: updatedCount,
      ignored: ignoredCount,
    });
  } catch (err) {
    console.error('Error importando usuarios:', err);
    if (conn) await conn.rollback();
    return res.status(500).json({ error: 'Error al importar usuarios.' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getProfile = async (req, res) => {
  const { id_usuario } = req.user; // viene del authMiddleware

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
         u.ID_USUARIO,
         u.NOMBRE_USUARIO,
         u.EMAIL_USUARIO,
         u.FECHA_CREA_USUARIO as FECHA_CREACION,
         u.FECHA_ACTU_USUARIO,
         u.ROL_ID_ROL,
         r.NOMBRE_ROL
       FROM USUARIO u
       JOIN ROL r ON u.ROL_ID_ROL = r.ID_ROL
      WHERE u.ID_USUARIO = :id`,
      { id: id_usuario },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.json({ perfil: result.rows[0] });
  } catch (err) {
    console.error('Error en getProfile:', err);
    return res.status(500).json({ error: 'Error al obtener perfil.' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

export const getUsuarios = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { rolId } = req.query;

    let sql = `
      SELECT u.ID_USUARIO, u.NOMBRE_USUARIO, u.EMAIL_USUARIO, u.ROL_ID_ROL , r.NOMBRE_ROL
      FROM USUARIO u
      JOIN ROL r ON u.ROL_ID_ROL = r.ID_ROL

    `;
    const params = {};

    if (rolId) {
      sql += ` WHERE u.ROL_ID_ROL = :rolId`;
      params.rolId = parseInt(rolId);
    }
    sql += ` ORDER BY NOMBRE_USUARIO`;

    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener usuarios');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection for getUsuarios', err);
      }
    }
  }
};
//obtener una lista de usuarios con rol docente
export const getDocentes = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const sql = `
      SELECT u.ID_USUARIO, u.NOMBRE_USUARIO, u.EMAIL_USUARIO
      FROM USUARIO u
      WHERE u.ROL_ID_ROL = 2 -- Filtrar directamente por el ID es más rápido
      ORDER BY u.NOMBRE_USUARIO
    `;

    const result = await connection.execute(
      sql,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al obtener docentes');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection for getDocentes', err);
      }
    }
  }
};
// VERSIÓN CORREGIDA de searchDocentes
export const searchDocentes = async (req, res) => {
  const searchTerm = req.query.q || '';
  if (!searchTerm) {
    return res.json([]);
  }

  let connection;
  try {
    connection = await getConnection();
    const sql = `
      SELECT
          u.ID_USUARIO,
          u.NOMBRE_USUARIO,
          (SELECT LISTAGG(s.NOMBRE_SECCION, ', ') WITHIN GROUP (ORDER BY s.NOMBRE_SECCION)
          FROM USUARIOSECCION us
          JOIN SECCION s ON us.SECCION_ID_SECCION = s.ID_SECCION
          WHERE us.USUARIO_ID_USUARIO = u.ID_USUARIO) AS SECCIONES
      FROM USUARIO u
      JOIN ROL r ON u.ROL_ID_ROL = r.ID_ROL
      WHERE r.NOMBRE_ROL = 'DOCENTE' -- O el rol correcto
        AND UPPER(u.NOMBRE_USUARIO) LIKE :searchTerm
    `;

    const result = await connection.execute(
      sql,
      { searchTerm: `%${searchTerm.toUpperCase()}%` }, // Usar named binds
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (error) {
    handleError(res, error, 'Error al buscar docentes');
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection for searchDocentes', err);
      }
    }
  }
};
