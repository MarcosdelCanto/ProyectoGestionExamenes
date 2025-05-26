import { getConnection } from '../db.js';
import oracledb from 'oracledb';

/**
 * Controlador para carga masiva de salas.
 */
export const handleCargaSalas = async (req, res) => {
  const datos = req.body; // el JSON con las filas
  let conn;
  let salasInsertadas = 0;
  let salasActualizadas = 0;
  let filasIgnoradas = 0;

  try {
    conn = await getConnection();

    for (const fila of datos) {
      const codSala = String(fila['Cod. Sala'] ?? '').trim();
      const nombreSala = String(fila['Nombre Sala'] ?? '').trim();
      const capacidadSala = parseInt(fila['Capacidad'] ?? 0);

      if (!codSala || !nombreSala) {
        filasIgnoradas++;
        console.warn('Fila ignorada: Código o nombre de sala vacío.');
        continue;
      }

      if (!capacidadSala || capacidadSala <= 0) {
        filasIgnoradas++;
        console.warn(
          `Fila ignorada para sala "${nombreSala}": Capacidad inválida.`
        );
        continue;
      }

      // Extraer la sigla del edificio de los caracteres antes del guión
      const siglaEdificio = codSala.split('-')[0];

      // Verificar si el edificio existe y obtener su ID
      const edificioResult = await conn.execute(
        'SELECT ID_EDIFICIO FROM ADMIN.EDIFICIO WHERE SIGLA_EDIFICIO = :sigla',
        { sigla: siglaEdificio },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (edificioResult.rows.length === 0) {
        filasIgnoradas++;
        console.warn(
          `Fila ignorada para sala "${nombreSala}": El edificio con sigla ${siglaEdificio} no existe.`
        );
        continue;
      }

      const edificioId = edificioResult.rows[0].ID_EDIFICIO;

      // Verificar si la sala ya existe por código
      const selectSalaSql =
        'SELECT ID_SALA FROM ADMIN.SALA WHERE NOMBRE_SALA = :nombre OR COD_SALA = :codigo';
      const salaExistente = await conn.execute(
        selectSalaSql,
        { nombre: nombreSala, codigo: codSala },
        { outFormat: oracledb.OUT_FORMAT_ARRAY }
      );

      if (salaExistente.rows.length > 0) {
        console.warn(
          `ADVERTENCIA: La sala con código "${codSala}" o nombre "${nombreSala}" ya existe. Fila omitida.`
        );
        filasIgnoradas++;
        continue;
      }

      // Insertar nueva sala
      const insertSalaSql = `INSERT INTO ADMIN.SALA (
                               ID_SALA, COD_SALA, NOMBRE_SALA, CAPACIDAD_SALA, EDIFICIO_ID_EDIFICIO
                             ) VALUES (
                               SEQ_SALA.NEXTVAL, :codigo, :nombre, :capacidad, :edificio_id
                             ) RETURNING ID_SALA INTO :newId`;

      const bindVars = {
        codigo: codSala,
        nombre: nombreSala,
        capacidad: capacidadSala,
        edificio_id: edificioId,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await conn.execute(insertSalaSql, bindVars, {
        autoCommit: false,
      });

      if (result.outBinds.newId && result.outBinds.newId.length > 0) {
        const idSala = result.outBinds.newId[0];
        salasInsertadas++;
        console.log(
          `  Sala insertada: Código "${codSala}", Nombre "${nombreSala}", ID_Sala: ${idSala}, Capacidad: ${capacidadSala}, Edificio: ${siglaEdificio}`
        );
      } else {
        throw new Error('No se pudo obtener el ID de la sala insertada');
      }
    }

    await conn.commit();
    return res.status(201).json({
      message: 'Carga de salas completada.',
      inserted: salasInsertadas,
      updated: salasActualizadas,
      ignored: filasIgnoradas,
    });
  } catch (e) {
    if (conn) await conn.rollback();
    console.error('Error en handleCargaSalas:', e);
    return res.status(500).json({
      error: 'Error interno del servidor al cargar salas.',
      details: e.message,
    });
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
