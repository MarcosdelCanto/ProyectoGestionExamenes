import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Obtener todos los permisos
export const fetchAllPermisos = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ID_PERMISO, NOMBRE_PERMISO, DESCRIPCION_PERMISO FROM ADMIN.PERMISOS ORDER BY NOMBRE_PERMISO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener permisos:', err);
    res.status(500).json({ error: 'No se pudieron obtener los permisos.' });
  } finally {
    if (conn) await conn.close();
  }
};

// Obtener permisos de un rol específico
export const fetchPermisosByRol = async (req, res) => {
  const { idRol } = req.params;
  console.log(`Backend: Solicitando permisos para rol ${idRol}`);

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT P.ID_PERMISO, P.NOMBRE_PERMISO, P.DESCRIPCION_PERMISO
         FROM ADMIN.PERMISOS P
         JOIN ADMIN.PERMISOSROL PR ON P.ID_PERMISO = PR.ID_PERMISO
        WHERE PR.ID_ROL = :idRol`,
      [idRol],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(
      `Backend: Encontrados ${result.rows.length} permisos para rol ${idRol}`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener permisos:', err);
    res.status(500).json({ error: 'No se pudieron obtener los permisos.' });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};

// Actualizar permisos de un rol (sobrescribe todos los permisos del rol)
export const updatePermisosRol = async (req, res) => {
  const { idRol } = req.params;
  const { permisos } = req.body; // Array de IDs de permisos
  let conn;
  if (!Array.isArray(permisos)) {
    return res
      .status(400)
      .json({ error: 'El formato de permisos debe ser un array.' });
  }
  try {
    conn = await getConnection();
    // Eliminar permisos actuales
    await conn.execute(`DELETE FROM ADMIN.PERMISOSROL WHERE ID_ROL = :idRol`, [
      idRol,
    ]);
    // Insertar nuevos permisos
    for (const idPermiso of permisos) {
      await conn.execute(
        `INSERT INTO ADMIN.PERMISOSROL (ID_PERMISOSROL, ID_ROL, ID_PERMISO)
         VALUES (SEQ_PERMISOSROL.NEXTVAL, :idRol, :idPermiso)`,
        { idRol, idPermiso }
      );
    }
    await conn.commit();
    res.json({ message: 'Permisos actualizados correctamente.' });
  } catch (err) {
    console.error('Error al actualizar permisos del rol:', err);
    res
      .status(500)
      .json({ error: 'No se pudieron actualizar los permisos del rol.' });
  } finally {
    if (conn) await conn.close();
  }
};
