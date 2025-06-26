/**
 * @fileoverview Helpers para pruebas de integración de base de datos
 * @description Funciones auxiliares que simulan operaciones complejas de BD
 * @author Sistema de Gestión de Exámenes
 * @version 1.0.0
 */

import { getConnection } from '../../../db.js';

/**
 * Crea un examen con múltiples reservas en una transacción
 */
export async function crearExamenConReservas({ examen, reservas }) {
  const connection = await getConnection();
  
  try {
    // Crear examen
    const examenResult = await connection.execute(
      `INSERT INTO examenes (nombre, descripcion, fecha_inicio, fecha_fin, id_asignatura, id_seccion) 
       VALUES (:nombre, :descripcion, :fecha_inicio, :fecha_fin, :id_asignatura, :id_seccion)
       RETURNING id_examen INTO :id`,
      {
        ...examen,
        id: { dir: 'out', type: 'number' }
      }
    );

    const examenId = examenResult.outBinds.id[0];
    const reservaIds = [];

    // Crear reservas
    for (const reserva of reservas) {
      const reservaResult = await connection.execute(
        `INSERT INTO reservas (id_examen, id_sala, fecha_inicio, fecha_fin, estado) 
         VALUES (:id_examen, :id_sala, :fecha_inicio, :fecha_fin, 'pendiente')
         RETURNING id_reserva INTO :id`,
        {
          ...reserva,
          id_examen: examenId,
          id: { dir: 'out', type: 'number' }
        }
      );
      
      reservaIds.push(reservaResult.outBinds.id[0]);
    }

    await connection.commit();
    return { examenId, reservaIds };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}

/**
 * Obtiene exámenes con detalles usando joins múltiples
 */
export async function obtenerExamenesConDetalles() {
  const connection = await getConnection();
  
  try {
    const result = await connection.execute(
      `SELECT 
        e.id_examen,
        e.nombre as nombre_examen,
        a.nombre as nombre_asignatura,
        s.nombre as nombre_seccion,
        sa.nombre as nombre_sala,
        sa.capacidad as capacidad_sala,
        r.fecha_inicio,
        r.fecha_fin
       FROM examenes e
       JOIN asignaturas a ON e.id_asignatura = a.id_asignatura
       JOIN secciones s ON e.id_seccion = s.id_seccion
       LEFT JOIN reservas r ON e.id_examen = r.id_examen
       LEFT JOIN salas sa ON r.id_sala = sa.id_sala
       ORDER BY e.fecha_inicio`,
      {}
    );

    return result.rows;
  } finally {
    await connection.close();
  }
}

/**
 * Obtiene usuarios con paginación
 */
export async function obtenerUsuariosPaginados({ page = 1, limit = 10 }) {
  const connection = await getConnection();
  
  try {
    const offset = (page - 1) * limit;
    
    const result = await connection.execute(
      `SELECT u.*, COUNT(*) OVER() as total_count
       FROM usuarios u
       ORDER BY u.nombre_usuario
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      { offset, limit }
    );

    const usuarios = result.rows;
    const total = usuarios.length > 0 ? usuarios[0].TOTAL_COUNT : 0;

    return {
      usuarios: usuarios.map(u => ({ ...u, TOTAL_COUNT: undefined })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } finally {
    await connection.close();
  }
}

/**
 * Obtiene usuarios (función simple para pruebas de error)
 */
export async function obtenerUsuarios() {
  const connection = await getConnection();
  
  try {
    const result = await connection.execute(
      'SELECT * FROM usuarios ORDER BY nombre_usuario',
      {}
    );

    return result.rows;
  } finally {
    await connection.close();
  }
}

/**
 * Procesa múltiples operaciones de forma concurrente
 */
export async function procesarOperacionesConcurrentes(operaciones) {
  const promesas = operaciones.map(async (operacion) => {
    const connection = await getConnection();
    
    try {
      const result = await connection.execute(operacion.sql, {});
      return { tipo: operacion.tipo, resultado: result.rows };
    } finally {
      await connection.close();
    }
  });

  return Promise.all(promesas);
}
