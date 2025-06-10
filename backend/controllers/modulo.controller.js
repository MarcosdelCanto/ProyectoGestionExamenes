import { getConnection } from "../db.js";
import oracledb from "oracledb";

// Función helper robusta para manejar errores de forma consistente
const handleError = (res, error, defaultMessage, statusCode = 500) => {
  console.error(
    `[handleError] Mensaje: ${defaultMessage}, Error Original:`,
    error,
  );
  const errorDetails =
    error && error.message
      ? error.message
      : typeof error === "string"
        ? error
        : "No hay detalles del error.";
  if (!res.headersSent) {
    res.status(statusCode).json({
      error: defaultMessage,
      details: errorDetails,
    });
  }
};

export const getAllModulos = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT m.id_modulo, m.nombre_modulo, m.inicio_modulo, m.fin_modulo, m.orden, m.estado_id_estado, e.nombre_estado
       FROM MODULO m
       JOIN ESTADO e ON m.estado_id_estado = e.id_estado
       ORDER BY orden`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener módulos:", err);
    res.status(500).json({ error: "Error al obtener módulos" });
  } finally {
    if (conn) await conn.close();
  }
};

export const getModuloById = async (req, res) => {
  const { id } = req.params;

  // 1. Convertir el ID a un número
  const moduloId = parseInt(id, 10);

  // 2. Validar si la conversión fue exitosa
  if (isNaN(moduloId)) {
    return handleError(
      res,
      new Error("ID inválido"),
      "El ID del módulo proporcionado no es un número válido.",
      400,
    );
  }

  let connection;
  try {
    connection = await getConnection();
    const sql = `SELECT * FROM MODULO WHERE ID_MODULO = :id`;

    // 3. Usar el ID ya validado y convertido a número
    const result = await connection.execute(
      sql,
      { id: moduloId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    if (result.rows.length === 0) {
      return handleError(res, null, "Módulo no encontrado", 404);
    }
    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error, "Error al obtener el módulo");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
};
// Función para crear un módulo
export const createModulo = async (req, res) => {
  const { nombre_modulo, inicio_modulo, fin_modulo, orden } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO MODULO (id_modulo, nombre_modulo, inicio_modulo, fin_modulo, orden, estado_id_estado)
       VALUES (SEQ_MODULO.NEXTVAL, :nombre, :inicio, :fin, :orden, 1)
       RETURNING id_modulo INTO :newId`,
      {
        nombre: nombre_modulo,
        inicio: inicio_modulo,
        fin: fin_modulo,
        orden,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    await conn.commit();
    res.status(201).json({ id_modulo: result.outBinds.newId[0] });
  } catch (err) {
    if (err.errorNum === 1) {
      return res
        .status(400)
        .json({ error: `Ya existe un módulo con orden ${orden}.` });
    }
    console.error("Error creando módulo:", err);
    res.status(500).json({ error: "Error creando módulo" });
  } finally {
    if (conn) await conn.close();
  }
};
//función para actualizar un módulo
export const updateModulo = async (req, res) => {
  const { id } = req.params;
  const { orden, nombre_modulo, inicio_modulo, fin_modulo, estado_id_estado } =
    req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE MODULO
       SET orden = :orden,
           nombre_modulo = :nombre,
           inicio_modulo = :inicio,
           fin_modulo = :fin,
           estado_id_estado = :estado_id
       WHERE id_modulo = :id`,
      {
        orden: Number(orden),
        nombre: nombre_modulo,
        inicio: inicio_modulo,
        fin: fin_modulo,
        id: Number(id),
        estado_id: Number(estado_id_estado),
      },
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "Módulo no encontrado" });
    await conn.commit();
    res.json({ message: "Módulo actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar módulo:", err);
    res.status(500).json({
      error: "Error al actualizar módulo",
      details: err.message,
    });
  } finally {
    if (conn) await conn.close();
  }
};
// Borra un modulo y actualiza el orden de los demás
export const deleteModulo = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `DELETE FROM MODULO WHERE id_modulo = :id`,
      [id],
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "Módulo no encontrado" });
    await conn.commit();
    res.json({ message: "Módulo eliminado" });
  } catch (err) {
    console.error("Error eliminando módulo:", err);
    res.status(500).json({ error: "Error eliminando módulo" });
  } finally {
    if (conn) await conn.close();
  }
};

export const getAvailableModules = async (req, res) => {
  const { fecha_reserva, sala_id, reserva_id_excluir } = req.query; // Cambiado para coincidir con el frontend

  console.log(
    `[getAvailableModules] Solicitud con fecha_reserva: ${fecha_reserva}, sala_id: ${sala_id}, reserva_id_excluir: ${reserva_id_excluir}`,
  );

  if (!fecha_reserva || !sala_id) {
    // Validar con los nuevos nombres
    return handleError(
      res,
      null,
      "Se requiere una fecha y una sala para buscar módulos disponibles.",
      400,
    );
  }

  let connection;
  try {
    connection = await getConnection();

    // Esta consulta ahora es más inteligente:
    // Busca todos los módulos ACTIVOS cuyo ID no esté en uso por OTRA reserva diferente a la que se está editando.
    const sql = `
      SELECT m.ID_MODULO, m.NOMBRE_MODULO, m.INICIO_MODULO, m.FIN_MODULO, m.ORDEN
      FROM MODULO m
      JOIN ESTADO e ON m.ESTADO_ID_ESTADO = e.ID_ESTADO
      WHERE e.NOMBRE_ESTADO = 'ACTIVO' -- Solo módulos activos
        AND NOT EXISTS (
          SELECT 1
          FROM RESERVAMODULO rm_inner
          JOIN RESERVA r_inner ON rm_inner.RESERVA_ID_RESERVA = r_inner.ID_RESERVA
          WHERE rm_inner.MODULO_ID_MODULO = m.ID_MODULO
            AND r_inner.SALA_ID_SALA = :sala_id_param
            AND TRUNC(r_inner.FECHA_RESERVA) = TO_DATE(:fecha_reserva_param, 'YYYY-MM-DD')
            -- Excluye la reserva actual de la comprobación de ocupación
            AND (:reserva_id_excluir_param IS NULL OR r_inner.ID_RESERVA != :reserva_id_excluir_param)
        )
      ORDER BY m.ORDEN
    `;

    const params = {
      sala_id_param: parseInt(sala_id),
      fecha_reserva_param: fecha_reserva,
      // Pasa el ID de la reserva a la consulta. Oracle manejará el caso de que sea null.
      reserva_id_excluir_param: reserva_id_excluir
        ? parseInt(reserva_id_excluir)
        : null,
    };

    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    res.json(result.rows);
  } catch (error) {
    handleError(res, error, "Error al obtener los módulos disponibles");
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
};
