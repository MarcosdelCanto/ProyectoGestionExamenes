import { getConnection } from '../db.js';
import oracledb from 'oracledb';

// Obtener todas las reservas (con filtros opcionales)
export const getAllReservas = async (req, res) => {
  let conn;
  try {
    // Aquí podrías añadir lógica para filtros (por fecha, sala, examen, estado, etc.)
    // que vendrían en req.query
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT r.ID_RESERVA, r.FECHA_RESERVA,
              e.ID_EXAMEN, e.NOMBRE_EXAMEN,
              s.ID_SALA, s.NOMBRE_SALA,
              est.ID_ESTADO, est.NOMBRE_ESTADO AS ESTADO_RESERVA
       FROM RESERVA r
       JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
       JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
       JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
       ORDER BY r.FECHA_RESERVA DESC, r.ID_RESERVA DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener reservas:', err);
    res
      .status(500)
      .json({ error: 'Error al obtener reservas', details: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Obtener una reserva por ID
export const getReservaById = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT r.ID_RESERVA, r.FECHA_RESERVA,
              e.ID_EXAMEN, e.NOMBRE_EXAMEN,
              s.ID_SALA, s.NOMBRE_SALA,
              est.ID_ESTADO, est.NOMBRE_ESTADO AS ESTADO_RESERVA
              -- , (SELECT LISTAGG(m.NOMBRE_MODULO, ', ') WITHIN GROUP (ORDER BY m.ORDEN)
              --      FROM RESERVAMODULO rm
              --      JOIN MODULO m ON rm.MODULO_ID_MODULO = m.ID_MODULO
              --      WHERE rm.RESERVA_ID_RESERVA = r.ID_RESERVA) AS MODULOS_RESERVADOS
       FROM RESERVA r
       JOIN EXAMEN e ON r.EXAMEN_ID_EXAMEN = e.ID_EXAMEN
       JOIN SALA s ON r.SALA_ID_SALA = s.ID_SALA
       JOIN ESTADO est ON r.ESTADO_ID_ESTADO = est.ID_ESTADO
       WHERE r.ID_RESERVA = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Reserva no encontrada' });

    // Opcional: Cargar módulos asociados
    const modulosResult = await conn.execute(
      `SELECT m.ID_MODULO, m.NOMBRE_MODULO, m.INICIO_MODULO, m.FIN_MODULO
         FROM RESERVAMODULO rm
         JOIN MODULO m ON rm.MODULO_ID_MODULO = m.ID_MODULO
         WHERE rm.RESERVA_ID_RESERVA = :reservaId
         ORDER BY m.ORDEN`,
      { reservaId: id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const reservaConModulos = {
      ...result.rows[0],
      MODULOS: modulosResult.rows,
    };

    res.json(reservaConModulos);
  } catch (err) {
    console.error('Error al obtener reserva:', err);
    res
      .status(500)
      .json({ error: 'Error al obtener reserva', details: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Crear una nueva reserva
export const createReserva = async (req, res) => {
  // Necesitarás: fecha_reserva, examen_id_examen, sala_id_sala, estado_id_estado (ej. 'Pendiente' o 'Confirmada')
  // y un array de modulo_id_modulo para RESERVAMODULO
  const {
    fecha_reserva,
    examen_id_examen,
    sala_id_sala,
    estado_id_estado, // ID del estado de la reserva
    modulos, // Array de IDs de módulo: [1, 2, 3]
  } = req.body;

  let conn;
  try {
    // VALIDACIONES IMPORTANTES ANTES DE INSERTAR:
    // 1. Verificar que la sala exista y esté disponible para la fecha y módulos.
    // 2. Verificar que el examen exista.
    // 3. Verificar que el estado exista.
    // 4. Verificar que los módulos existan.
    // (Estas validaciones se omiten por brevedad pero son cruciales)

    conn = await getConnection();
    await conn.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'");

    // Iniciar transacción si vas a insertar en múltiples tablas (RESERVA y RESERVAMODULO)
    // await conn.begin(); // No es estrictamente necesario con autoCommit: false, pero es buena práctica para claridad

    const resultReserva = await conn.execute(
      `INSERT INTO RESERVA (ID_RESERVA, FECHA_RESERVA, EXAMEN_ID_EXAMEN, SALA_ID_SALA, ESTADO_ID_ESTADO)
       VALUES (SEQ_RESERVA.NEXTVAL, TO_DATE(:fecha_reserva, 'YYYY-MM-DD'), :examen_id, :sala_id, :estado_id)
       RETURNING ID_RESERVA INTO :newId`,
      {
        fecha_reserva,
        examen_id: examen_id_examen,
        sala_id: sala_id_sala,
        estado_id: estado_id_estado,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: false } // No hacer commit aún si hay más inserciones
    );

    const newReservaId = resultReserva.outBinds.newId[0];

    if (modulos && Array.isArray(modulos) && modulos.length > 0) {
      for (const moduloId of modulos) {
        await conn.execute(
          `INSERT INTO RESERVAMODULO (RESERVA_ID_RESERVA, MODULO_ID_MODULO)
           VALUES (:reserva_id, :modulo_id)`,
          { reserva_id: newReservaId, modulo_id: moduloId },
          { autoCommit: false }
        );
      }
    }

    await conn.commit(); // Commit final de todas las operaciones
    res.status(201).json({
      message: 'Reserva creada con éxito',
      id_reserva: newReservaId,
    });
  } catch (err) {
    if (conn) await conn.rollback(); // Rollback en caso de error
    console.error('Error al crear reserva:', err);
    res
      .status(500)
      .json({ error: 'Error al crear reserva', details: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Actualizar una reserva (ej. cambiar estado, sala, módulos)
export const updateReserva = async (req, res) => {
  const { id } = req.params;
  const {
    fecha_reserva,
    examen_id_examen,
    sala_id_sala,
    estado_id_estado,
    modulos, // Array de IDs de módulo
  } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'");

    // Lógica de actualización para la tabla RESERVA
    // (Validaciones de disponibilidad, etc., omitidas por brevedad)
    const resultUpdateReserva = await conn.execute(
      `UPDATE RESERVA
       SET FECHA_RESERVA = TO_DATE(:fecha_reserva, 'YYYY-MM-DD'),
           EXAMEN_ID_EXAMEN = :examen_id,
           SALA_ID_SALA = :sala_id,
           ESTADO_ID_ESTADO = :estado_id
       WHERE ID_RESERVA = :id`,
      {
        id,
        fecha_reserva,
        examen_id: examen_id_examen,
        sala_id: sala_id_sala,
        estado_id: estado_id_estado,
      },
      { autoCommit: false }
    );

    if (resultUpdateReserva.rowsAffected === 0) {
      return res
        .status(404)
        .json({ error: 'Reserva no encontrada para actualizar' });
    }

    // Actualizar RESERVAMODULO:
    // 1. Eliminar módulos actuales para esta reserva
    await conn.execute(
      `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :reserva_id`,
      { reserva_id: id },
      { autoCommit: false }
    );
    // 2. Insertar los nuevos módulos
    if (modulos && Array.isArray(modulos) && modulos.length > 0) {
      for (const moduloId of modulos) {
        await conn.execute(
          `INSERT INTO RESERVAMODULO (RESERVA_ID_RESERVA, MODULO_ID_MODULO)
           VALUES (:reserva_id, :modulo_id)`,
          { reserva_id: id, modulo_id: moduloId },
          { autoCommit: false }
        );
      }
    }

    await conn.commit();
    res.json({ message: 'Reserva actualizada con éxito' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error al actualizar reserva:', err);
    res
      .status(500)
      .json({ error: 'Error al actualizar reserva', details: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Eliminar (cancelar) una reserva
export const deleteReserva = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    // Primero eliminar de RESERVAMODULO debido a la FK
    await conn.execute(
      `DELETE FROM RESERVAMODULO WHERE RESERVA_ID_RESERVA = :id`,
      [id],
      { autoCommit: false }
    );

    const result = await conn.execute(
      `DELETE FROM RESERVA WHERE ID_RESERVA = :id`,
      [id],
      { autoCommit: false }
    );

    if (result.rowsAffected === 0) {
      // Si no se eliminó de RESERVA, puede que no existiera o ya se borró de RESERVAMODULO
      // Podrías hacer un rollback aquí si consideras que es un estado inconsistente
      // await conn.rollback();
      return res
        .status(404)
        .json({ error: 'Reserva no encontrada para eliminar' });
    }

    await conn.commit();
    res.json({ message: 'Reserva eliminada/cancelada con éxito' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Error al eliminar reserva:', err);
    res
      .status(500)
      .json({ error: 'Error al eliminar reserva', details: err.message });
  } finally {
    if (conn) await conn.close();
  }
};
