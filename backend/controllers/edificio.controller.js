import { getConnection } from '../db.js';
import oracledb from 'oracledb';

export const getAllEdificios = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.id_edificio, e.nombre_edificio, e.sigla_edificio,
              e.sede_id_sede, s.nombre_sede
       FROM EDIFICIO e
       JOIN SEDE s ON e.sede_id_sede = s.id_sede
       ORDER BY e.id_edificio`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener edificios:', err);
    res.status(500).json({ error: 'Error al obtener edificios' });
  } finally {
    if (conn) await conn.close();
  }
};

export const getEdificioById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.*, s.nombre_sede
       FROM EDIFICIO e
       JOIN SEDE s ON e.sede_id_sede = s.id_sede
       WHERE e.id_edificio = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Edificio no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener edificio:', err);
    res.status(500).json({ error: 'Error al obtener edificio' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createEdificio = async (req, res) => {
  const { nombre_edificio, sigla_edificio, sede_id_sede } = req.body;
  let conn;
  try {
    // Validación básica de datos
    if (!nombre_edificio || !sigla_edificio || !sede_id_sede) {
      return res.status(400).json({
        error:
          'Todos los campos son requeridos (nombre_edificio, sigla_edificio, sede_id_sede)',
      });
    }

    conn = await getConnection();

    // Verificar si la sede existe
    const sedeExists = await conn.execute(
      'SELECT 1 FROM SEDE WHERE id_sede = :sede_id',
      [sede_id_sede],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (sedeExists.rows.length === 0) {
      return res.status(400).json({ error: 'La sede especificada no existe' });
    }

    const result = await conn.execute(
      `INSERT INTO EDIFICIO (id_edificio, nombre_edificio, sigla_edificio, sede_id_sede)
       VALUES (SEQ_EDIFICIO.NEXTVAL, :nombre, :sigla, :sede_id)
       RETURNING id_edificio INTO :newId`,
      {
        nombre: nombre_edificio,
        sigla: sigla_edificio,
        sede_id: sede_id_sede,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_edificio: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear edificio:', err);
    // Manejo más específico de errores
    if (err.errorNum === 1 || err.errorNum === 1400) {
      return res
        .status(400)
        .json({ error: 'Error de validación: verifique los datos ingresados' });
    }
    res
      .status(500)
      .json({ error: 'Error al crear edificio', detalles: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateEdificio = async (req, res) => {
  const { id } = req.params;
  const { nombre_edificio, sigla_edificio, sede_id_sede } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE EDIFICIO
       SET nombre_edificio = :nombre,
           sigla_edificio = :sigla,
           sede_id_sede = :sede_id
       WHERE id_edificio = :id`,
      {
        id,
        nombre: nombre_edificio,
        sigla: sigla_edificio,
        sede_id: sede_id_sede,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Edificio no encontrado' });
    await conn.commit();
    res.status(200).json({ message: 'Edificio actualizado' });
  } catch (err) {
    console.error('Error al actualizar edificio:', err);
    res.status(500).json({ error: 'Error al actualizar edificio' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteEdificio = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM EDIFICIO WHERE id_edificio = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Edificio no encontrado' });
    await conn.commit();
    res.status(200).json({ message: 'Edificio eliminado' });
  } catch (err) {
    console.error('Error al eliminar edificio:', err);
    res.status(500).json({ error: 'Error al eliminar edificio' });
  } finally {
    if (conn) await conn.close();
  }
};
