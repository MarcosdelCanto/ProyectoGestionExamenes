import { getConnection } from '../db.js';
import oracledb from 'oracledb';

const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, ':', error);
  res
    .status(statusCode)
    .json({ error: message, details: error.message || error });
};

export const getAllExamenes = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT  e.id_examen, e.nombre_examen, e.inscritos_examen, e.tipo_procesamiento_examen, e.plataforma_prose_examen,
        e.situacion_evaluativa_examen, e.cantidad_modulos_examen, s.nombre_seccion, a.nombre_asignatura, es.nombre_estado, e.seccion_id_seccion, e.estado_id_estado
      FROM    EXAMEN e
      JOIN    SECCION s ON e.seccion_id_seccion = s.id_seccion
      JOIN    ASIGNATURA a ON s.asignatura_id_asignatura = a.id_asignatura
      JOIN    ESTADO es ON e.estado_id_estado = es.id_estado
      ORDER BY e.id_examen`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener examenes:', err);
    res
      .status(500)
      .json({ error: 'Error al obtener examenes', details: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

export const getExamenById = async (req, res) => {
  const { id } = req.params;
  const examenId = parseInt(id, 10); // Convertimos a número base 10
  if (isNaN(examenId)) {
    return handleError(
      res,
      null,
      'El ID del examen proporcionado no es un número válido.',
      400
    ); // Bad Request
  }
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.*, s.nombre_seccion, a.nombre_asignatura, es.nombre_estado
      FROM EXAMEN e
      JOIN SECCION s ON e.seccion_id_seccion = s.id_seccion
      JOIN ASIGNATURA a ON s.asignatura_id_asignatura = a.id_asignatura
      JOIN ESTADO es ON e.estado_id_estado = es.id_estado
      WHERE e.id_examen = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Examen no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener examen:', err);
    res.status(500).json({ error: 'Error al obtener examen' });
  } finally {
    if (conn) await conn.close();
  }
};

export const createExamen = async (req, res) => {
  const {
    nombre_examen,
    inscritos_examen,
    tipo_procesamiento_examen,
    plataforma_prose_examen,
    situacion_evaluativa_examen,
    cantidad_modulos_examen,
    seccion_id_seccion,
    estado_id_estado,
  } = req.body;
  console.log(req.body);
  let conn;
  try {
    if (
      !nombre_examen ||
      !inscritos_examen ||
      !tipo_procesamiento_examen ||
      !plataforma_prose_examen ||
      !situacion_evaluativa_examen ||
      !cantidad_modulos_examen ||
      !seccion_id_seccion ||
      !estado_id_estado
    ) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }
    conn = await getConnection();

    const seccionExists = await conn.execute(
      'SELECT 1 FROM SECCION WHERE id_seccion = :id',
      [seccion_id_seccion],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (seccionExists.rows.length === 0) {
      return res.status(404).json({ error: 'La sección no existe' });
    }

    const estadoExists = await conn.execute(
      'SELECT 1 FROM ESTADO WHERE id_estado = :id',
      [estado_id_estado],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (estadoExists.rows.length === 0) {
      return res.status(404).json({ error: 'El estado no existe' });
    }

    const result = await conn.execute(
      `INSERT INTO EXAMEN (id_examen, nombre_examen, inscritos_examen, tipo_procesamiento_examen, plataforma_prose_examen, situacion_evaluativa_examen, cantidad_modulos_examen, seccion_id_seccion, estado_id_estado)
      VALUES (SEQ_EXAMEN.NEXTVAL, :nombre, :inscritos, :tipo_procesamiento, :plataforma_prose_examen, :situacion_evaluativa, :cantidad_modulos, :seccion_id_seccion, :estado_id_estado) RETURNING id_examen INTO :newId`,
      {
        nombre: nombre_examen,
        inscritos: inscritos_examen,
        tipo_procesamiento: tipo_procesamiento_examen,
        plataforma_prose_examen: plataforma_prose_examen,
        situacion_evaluativa: situacion_evaluativa_examen,
        cantidad_modulos: cantidad_modulos_examen,
        seccion_id_seccion: seccion_id_seccion,
        estado_id_estado: estado_id_estado,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    await conn.commit();
    res.status(201).json({ id_examen: result.outBinds.newId[0] });
  } catch (err) {
    console.error('Error al crear examen:', err);
    if (err.errorNum === 1 || err.errorNum === 1400) {
      return res
        .status(400)
        .json({ error: 'Error de validación: verifique los datos ingresados' });
    }
    res
      .status(500)
      .json({ error: 'Error al crear examen', detalles: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

export const updateExamen = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_examen,
    inscritos_examen,
    tipo_procesamiento_examen,
    plataforma_prose_examen,
    situacion_evaluativa_examen,
    cantidad_modulos_examen,
    seccion_id_seccion,
    estado_id_estado,
  } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE EXAMEN
      SET nombre_examen = :nombre,
          inscritos_examen = :inscritos,
          tipo_procesamiento_examen = :tipo_procesamiento,plataforma_prose_examen = :plataforma_prose_examen,situacion_evaluativa_examen = :situacion_evaluativa,cantidad_modulos_examen = :cantidad_modulos,
          seccion_id_seccion = :seccion_id_seccion,
          estado_id_estado = :estado_id_estado
        WHERE id_examen = :id`,
      {
        id,
        nombre: nombre_examen,
        inscritos: inscritos_examen,
        tipo_procesamiento: tipo_procesamiento_examen,
        plataforma_prose_examen: plataforma_prose_examen,
        situacion_evaluativa: situacion_evaluativa_examen,
        cantidad_modulos: cantidad_modulos_examen,
        seccion_id_seccion: seccion_id_seccion,
        estado_id_estado: estado_id_estado,
      }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Examen no encontrado' });
    await conn.commit();
    res.status(200).json({ message: 'Examen actualizado' });
  } catch (err) {
    console.error('Error al actualizar examen:', err);
    res.status(500).json({ error: 'Error al actualizar examen' });
  } finally {
    if (conn) await conn.close();
  }
};

export const deleteExamen = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM EXAMEN WHERE id_examen = :id`,
      [id]
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Examen no encontrado' });
    await conn.commit();
    res.status(200).json({ message: 'Examen eliminado' });
  } catch (err) {
    console.error('Error al eliminar examen:', err);
    res.status(500).json({ error: 'Error al eliminar examen' });
  } finally {
    if (conn) await conn.close();
  }
};
export const getAllExamenesForSelect = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const sql = `
      SELECT
        E.ID_EXAMEN,
        E.NOMBRE_EXAMEN,
        S.NOMBRE_SECCION,
        A.NOMBRE_ASIGNATURA
      FROM EXAMEN E
      JOIN SECCION S ON E.SECCION_ID_SECCION = S.ID_SECCION
      JOIN ASIGNATURA A ON S.ASIGNATURA_ID_ASIGNATURA = A.ID_ASIGNATURA
      ORDER BY E.NOMBRE_EXAMEN, S.NOMBRE_SECCION
    `;
    const result = await connection.execute(
      sql,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (error) {
    // La llamada a handleError aquí imprimirá el error detallado en la consola del backend
    handleError(
      res,
      error,
      'Error al obtener todos los exámenes para selección'
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        // Esto también se vería en la consola del backend si falla el cierre
        console.error(
          'Error closing connection for getAllExamenesForSelect',
          err
        );
      }
    }
  }
};
