import { getConnection } from '../db.js';
import oracledb from 'oracledb';

export const getAllReservas = async (req, res) => {
  try {
    const conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM RESERVA ORDER BY FECHA_RESERVA`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};
export const createReserva = async (req, res) => {
  const { FECHA_RESERVA, SALA_ID_SALA, EXAMEN_ID_EXAMEN, Modulos } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const insertCabecera = `
      INSERT INTO RESERVA (ID_RESERVA, FECHA_RESERVA, SALA_ID_SALA, EXAMEN_ID_EXAMEN)
      VALUES (RESERVA_SEQ.NEXTVAL, TO_TIMESTAMP(:fecha, 'YYYY-MM-DD"T"HH24:MI:SS'), :sala, :examen)
      RETURNING ID_RESERVA INTO :id`;
    const bindsCab = {
      fecha: FECHA_RESERVA,
      sala: SALA_ID_SALA,
      examen: EXAMEN_ID_EXAMEN,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };
    const resultCab = await conn.execute(insertCabecera, bindsCab, {
      autoCommit: false,
    });
    const newId = resultCab.outBinds.id[0];

    //insertar detalle por cada modulo
    const insertDetalle = `
        INSERT INTO RESERVA_MODULO (RESERVA_ID_RESERVA, MODULO_ID_MODULO)
        VALUES (:reserva, :modulo)`;
    for (const m of Modulos) {
      await conn.execute(insertDetalle, {
        reserva: newId,
        modulo: m.MODULO_ID_MODULO,
      });
    }
    await conn.commit();
    res.status(201).json({ message: 'Reserva creada exitosamente', id: newId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error al crear reserva:', err);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
};
