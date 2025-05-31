// controllers/user.controller.js
import { getConnection } from '../db.js';
import bcrypt from 'bcrypt'; // Importar bcrypt
import oracledb from 'oracledb';

const handleError = (res, error, message) => {
  console.error(message, ':', error);
  res.status(500).json({ error: message, details: error.message });
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
      SELECT ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, ROL_ID_ROL
      FROM USUARIO
    `;
    const params = {};

    if (rolId) {
      sql += ` WHERE ROL_ID_ROL = :rolId`;
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
