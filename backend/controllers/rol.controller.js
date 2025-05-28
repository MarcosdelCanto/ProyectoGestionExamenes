import { getConnection } from '../db.js';
import oracledb from 'oracledb';
/**
 * Controlador para obtener todos los roles.
 */
export const fetchAllRoles = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_ROL, NOMBRE_ROL
         FROM ADMIN.ROL
        ORDER BY NOMBRE_ROL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener roles:', err);
    res.status(500).json({ error: 'No se pudieron obtener los roles.' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Controlador para obtener un rol por su ID.
 */
export const getRoleById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_ROL, NOMBRE_ROL
         FROM ADMIN.ROL
        WHERE ID_ROL = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener rol por ID:', err);
    res.status(500).json({ error: 'No se pudo obtener el rol.' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Controlador para crear un nuevo rol.
 * Asume que la tabla ROL tiene ID_ROL (autoincremental con SEQ_ROL) y NOMBRE_ROL.
 */
export const createRole = async (req, res) => {
  const { NOMBRE_ROL, permisos } = req.body;
  let conn;
  console.log('[CREATE ROLE] Body recibido:', req.body);
  if (!NOMBRE_ROL || NOMBRE_ROL.trim() === '') {
    return res.status(400).json({ error: 'El nombre del rol es obligatorio.' });
  }
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO ADMIN.ROL (ID_ROL, NOMBRE_ROL)
       VALUES (SEQ_ROL.NEXTVAL, :nombre_rol)
       RETURNING ID_ROL INTO :newId`,
      {
        nombre_rol: NOMBRE_ROL,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const newRoleId = result.outBinds.newId[0];
    console.log(`[CREATE ROLE] Rol creado con ID: ${newRoleId}`);
    if (Array.isArray(permisos) && permisos.length > 0) {
      console.log(`[CREATE ROLE] Permisos a asociar:`, permisos);
      for (const idPermiso of permisos) {
        await conn.execute(
          `INSERT INTO ADMIN.PERMISOSROL (ID_ROL, ID_PERMISO) VALUES (:idRol, :idPermiso)`,
          { idRol: newRoleId, idPermiso }
        );
      }
    } else {
      console.log('[CREATE ROLE] No se enviaron permisos para asociar.');
    }
    await conn.commit();
    res.status(201).json({ ID_ROL: newRoleId, NOMBRE_ROL });
  } catch (err) {
    console.error('Error al crear rol:', err);
    // Manejo de error específico para violación de constraint único (si NOMBRE_ROL debe ser único)
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res
        .status(409)
        .json({ error: `El rol con nombre '${NOMBRE_ROL}' ya existe.` });
    }
    res.status(500).json({ error: 'No se pudo crear el rol.' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Controlador para actualizar un rol existente por su ID.
 */
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { NOMBRE_ROL, permisos } = req.body;
  let conn;
  console.log(`[UPDATE ROLE] Body recibido:`, req.body);
  if (!NOMBRE_ROL || NOMBRE_ROL.trim() === '') {
    return res.status(400).json({ error: 'El nombre del rol es obligatorio.' });
  }
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE ADMIN.ROL SET NOMBRE_ROL = :nombre_rol WHERE ID_ROL = :id`,
      { id, nombre_rol: NOMBRE_ROL }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Rol no encontrado para actualizar.' });
    }
    await conn.execute(
      `DELETE FROM ADMIN.PERMISOSROL WHERE ID_ROL = :idRol`,
      { idRol: id }
    );
    if (Array.isArray(permisos) && permisos.length > 0) {
      console.log(`[UPDATE ROLE] Permisos a asociar:`, permisos);
      for (const idPermiso of permisos) {
        await conn.execute(
          `INSERT INTO ADMIN.PERMISOSROL (ID_ROL, ID_PERMISO) VALUES (:idRol, :idPermiso)`,
          { idRol: id, idPermiso }
        );
      }
    } else {
      console.log('[UPDATE ROLE] No se enviaron permisos para asociar.');
    }
    await conn.commit();
    res.status(200).json({ message: 'Rol actualizado exitosamente.', ID_ROL: Number(id), NOMBRE_ROL });
  } catch (err) {
    console.error('Error al actualizar rol:', err);
    if (err.errorNum === 1) {
      // ORA-00001: unique constraint violated
      return res.status(409).json({
        error: `El nombre de rol '${NOMBRE_ROL}' ya está en uso por otro rol.`,
      });
    }
    res.status(500).json({ error: 'No se pudo actualizar el rol.' });
  } finally {
    if (conn) await conn.close();
  }
};

/**
 * Controlador para eliminar un rol por su ID.
 */
export const deleteRole = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM ADMIN.ROL WHERE ID_ROL = :id`,
      [id]
    );

    if (result.rowsAffected === 0) {
      return res
        .status(404)
        .json({ error: 'Rol no encontrado para eliminar.' });
    }
    await conn.commit();
    res.status(200).json({ message: 'Rol eliminado exitosamente.' });
  } catch (err) {
    console.error('Error al eliminar rol:', err);
    // Considerar errores de FK si un rol está en uso
    if (err.errorNum === 2292) {
      // ORA-02292: integrity constraint violated - child record found
      return res.status(409).json({
        error:
          'No se puede eliminar el rol porque está asignado a uno o más usuarios.',
      });
    }
    res.status(500).json({ error: 'No se pudo eliminar el rol.' });
  } finally {
    if (conn) await conn.close();
  }
};
