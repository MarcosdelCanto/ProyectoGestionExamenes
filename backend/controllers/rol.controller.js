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
