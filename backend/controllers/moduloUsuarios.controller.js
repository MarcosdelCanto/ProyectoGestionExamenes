import { getConnection } from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import csvParser from 'csv-parser';

//lista todos los roles
export const listRoles = async (req, res, next) => {
  try {
    const conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_ROL, NOMBRE_ROL
         FROM ROL
        ORDER BY ID_ROL`
    );
    await conn.close();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    next(error);
  }
};

// Función para obtener todos los usuarios
export const listUsuarios = async (req, res, next) => {
  try {
    const conn = await getConnection();
    const result = await conn.execute(
      `SELECT u.ID_USUARIO,
              u.NOMBRE_USUARIO,
              u.EMAIL_USUARIO,
              r.NOMBRE_ROL
         FROM USUARIO u
         JOIN ROL r ON u.ROL_ID_ROL = r.ID_ROL`
    );
    await conn.close();
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    next(error);
  }
};

// funcion para crear un nuevo usuario
export const createUsuario = async (req, res, next) => {
  try {
    const { nombre_usuario, email_usuario, rol_id_rol } = req.body;
    const plainPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const conn = await getConnection();
    await conn.execute(
      `INSERT INTO USUARIO
         (ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
          FECHA_CREA_USUARIO, ROL_ID_ROL)
       VALUES
         (USUARIO_SEQ.NEXTVAL, :n, :e, :p, SYSTIMESTAMP, :r)`,
      { n: nombre_usuario, e: email_usuario, p: hashedPassword, r: rol_id_rol },
      { autoCommit: true }
    );
    await conn.close();
  } catch (error) {
    console.error('Error al crear usuario:', error);
    next(error);
  }
};

// funcion para actualizar un usuario existente
export const updateUsuario = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const { nombre_usuario, email_usuario, rol_id_rol } = req.body;
    const conn = await getConnection();
    await conn.execute(
      `UPDATE USUARIO
         SET NOMBRE_USUARIO = :n,
             EMAIL_USUARIO = :e,
             ROL_ID_ROL = :r,
             FECHA_ACTU_USUARIO = SYSTIMESTAMP
       WHERE ID_USUARIO = :id`,
      { n: nombre_usuario, e: email_usuario, r: rol_id_rol, id: id_usuario },
      { autoCommit: true }
    );
    await conn.close();
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    next(error);
  }
};
// funcion para eliminar un usuario existente
export const deleteUsuario = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const conn = await getConnection();
    await conn.execute(
      `DELETE FROM USUARIO
       WHERE ID_USUARIO = :id`,
      { id: id_usuario },
      { autoCommit: true }
    );
    await conn.close();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    next(error);
  }
};

// funcion para cargar usuarios desde un archivo CSV
export const importUsuarios = async (req, res, next) => {
  try {
    const rows = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        const conn = await getConnection();
        for (const { NOMBRE_USUARIO, EMAIL_USUARIO, ROL_ID_ROL } of rows) {
          const plainPassword = crypto.randomBytes(8).toString('hex');
          const hashedPassword = await bcrypt.hash(plainPassword, 10);
          await conn.execute(
            `INSERT INTO USUARIO
               (ID_USUARIO, NOMBRE_USUARIO, EMAIL_USUARIO, PASSWORD_USUARIO,
                FECHA_CREA_USUARIO, ROL_ID_ROL)
             VALUES
               (USUARIO_SEQ.NEXTVAL, :n, :e, :p, SYSTIMESTAMP, :r)`,
            {
              n: NOMBRE_USUARIO,
              e: EMAIL_USUARIO,
              p: hashedPassword,
              r: ROL_ID_ROL,
            },
            { autoCommit: true }
          );
        }
        await conn.commit();
        await conn.close();
        fs.unlinkSync(req.file.path); // Eliminar el archivo CSV después de procesarlo
        res.json({
          message: 'Usuarios importados correctamente',
          count: rows.length,
        });
      });
  } catch (error) {
    console.error('Error al importar usuarios:', error);
    next(error);
  }
};
