import { getConnection } from '../db.js';
import bcrypt from 'bcrypt';
import oracledb from 'oracledb';

const ROL_DOCENTE_ID = 2;

export const handleCargaDocentes = async (req, res) => {
  const { rows } = req.body;
  let conn;
  let insertedCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;
  const errorsDetallados = []; // Para acumular errores específicos

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({
      error:
        'El formato de datos es incorrecto. Se esperaba un array de filas (rows).',
    });
  }

  try {
    conn = await getConnection();

    for (const fila of rows) {
      const idDocente = String(fila['ID Docente'] ?? '').trim();
      const nombre =
        String(fila['Nombre Docente'] ?? '').trim() || 'Sin Nombre';
      const emailOriginal = String(fila['Mail Duoc'] ?? '').trim(); // Guardar original para logs

      if (!idDocente) {
        ignoredCount++;
        errorsDetallados.push({
          idDocente,
          email: emailOriginal,
          error: 'ID Docente vacío.',
        });
        continue;
      }

      // --- Ya NO hacemos la primera verificación de email aquí ---

      // Buscar el usuario por ID_DOCENTE para decidir si insertar o actualizar
      const sel = await conn.execute(
        `SELECT ID_USUARIO, EMAIL_USUARIO FROM USUARIO WHERE ID_DOCENTE = :idDocente`, // Traer email actual
        { idDocente },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (sel.rows.length > 0) {
        // --- LÓGICA DE ACTUALIZACIÓN ---
        const existingUserId = sel.rows[0].ID_USUARIO;
        // const currentDbEmail = sel.rows[0].EMAIL_USUARIO; // Email actual en BD

        let updateQuery = 'UPDATE USUARIO SET FECHA_ACTU_USUARIO = SYSDATE';
        const updateBinds = { idUsuario: existingUserId }; // Actualizar por ID_USUARIO para más precisión

        let emailParaActualizar = null;

        if (emailOriginal) {
          // Solo si se proporciona un email en el archivo
          // Verificar si el nuevo email ya está en uso por OTRO usuario
          const emailConflictCheck = await conn.execute(
            `SELECT ID_USUARIO FROM USUARIO WHERE LOWER(EMAIL_USUARIO) = LOWER(:email) AND ID_USUARIO != :idUsuario`,
            { email: emailOriginal, idUsuario: existingUserId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
          if (emailConflictCheck.rows.length > 0) {
            const errorMsg = `Al intentar actualizar Docente ID ${idDocente}: El email ${emailOriginal} ya está en uso por otro usuario. Actualización de email ignorada.`;
            console.warn(errorMsg);
            errorsDetallados.push({
              idDocente,
              email: emailOriginal,
              error: errorMsg,
            });
            // No se añade el email a la actualización
          } else {
            emailParaActualizar = emailOriginal; // Email es válido para actualizar
          }
        }

        if (emailParaActualizar) {
          updateQuery += ', EMAIL_USUARIO = LOWER(:email)'; // Actualizar con email en minúsculas
          updateBinds.email = emailParaActualizar;
        }

        if (nombre && nombre !== 'Sin Nombre') {
          updateQuery += ', NOMBRE_USUARIO = :nombre';
          updateBinds.nombre = nombre;
        }

        updateQuery += ' WHERE ID_USUARIO = :idUsuario';

        // Solo ejecutar la actualización si hay algo que cambiar además de la fecha
        if (Object.keys(updateBinds).length > 2) {
          // idUsuario, y al menos nombre o email
          await conn.execute(updateQuery, updateBinds);
          updatedCount++;
        } else if (emailParaActualizar || (nombre && nombre !== 'Sin Nombre')) {
          // Caso donde solo se actualiza un campo (nombre o email) y la fecha
          await conn.execute(updateQuery, updateBinds);
          updatedCount++;
        } else {
          // No hay cambios significativos para actualizar más que la fecha
          // console.warn(
          //   `Docente con ID ${idDocente} (Usuario ID ${existingUserId}) encontrado, pero no se proporcionaron nuevos datos válidos de nombre o email para actualizar.`
          // );
        }
      } else {
        // --- LÓGICA DE INSERCIÓN ---
        if (!emailOriginal) {
          const errorMsg = `Nuevo docente con ID ${idDocente} no tiene email. Ignorando.`;
          console.warn(errorMsg);
          errorsDetallados.push({
            idDocente,
            email: emailOriginal,
            error: errorMsg,
          });
          ignoredCount++;
          continue;
        }

        // Verificar si el email ya existe para CUALQUIER usuario antes de insertar
        const emailExistsForInsert = await conn.execute(
          `SELECT ID_USUARIO FROM USUARIO WHERE LOWER(EMAIL_USUARIO) = LOWER(:email)`,
          { email: emailOriginal },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (emailExistsForInsert.rows.length > 0) {
          const errorMsg = `Al intentar insertar Docente ID ${idDocente}: El email ${emailOriginal} ya está en uso. Inserción ignorada.`;
          console.warn(errorMsg);
          errorsDetallados.push({
            idDocente,
            email: emailOriginal,
            error: errorMsg,
          });
          ignoredCount++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(idDocente, 10); // Considera una mejor estrategia para la contraseña
        await conn.execute(
          `INSERT INTO USUARIO(
               ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
               FECHA_CREA_USUARIO, FECHA_ACTU_USUARIO, ROL_ID_ROL, ID_DOCENTE
             ) VALUES (
               SEQ_USUARIO.NEXTVAL, :nombre, LOWER(:email), :password,
               SYSDATE, NULL, :rolId, :idDocente
             )`,
          {
            nombre,
            email: emailOriginal,
            password: hashedPassword,
            rolId: ROL_DOCENTE_ID,
            idDocente,
          }
        );
        insertedCount++;
      }
    }

    await conn.commit();
    return res.json({
      message: 'Proceso de importación de docentes completado.',
      inserted: insertedCount,
      updated: updatedCount,
      ignored: ignoredCount,
      errors: errorsDetallados, // Devolver errores detallados
    });
  } catch (err) {
    console.error('Error importando docentes:', err);
    if (conn) await conn.rollback();
    // Devolver el error de Oracle si es un ORA-00001 para más claridad
    if (err.errorNum === 1) {
      return res.status(409).json({
        // 409 Conflict
        error:
          'Error de duplicado en la base de datos. Uno o más emails ya existen.',
        oracleError: err.message,
        details: errorsDetallados,
      });
    }
    return res
      .status(500)
      .json({
        error: 'Error interno al importar docentes.',
        details: errorsDetallados,
      });
  } finally {
    if (conn) await conn.close();
  }
};
