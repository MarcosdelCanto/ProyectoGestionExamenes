import React, { useMemo } from 'react';
import { format } from 'date-fns';
import CalendarHeader from './CalendarHeader';
import CalendarCell from './CalendarCell';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useDispatch, useSelector } from 'react-redux'; // <-- IMPORTAR
import {
  actualizarEstadoConfirmacionReserva,
  eliminarReserva,
} from '../../store/reservasSlice'; // <-- IMPORTAR ACCIONES

export default function CalendarGrid({
  fechas,
  modulos,
  feriadosData = [],
  periodosActivos = [],
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
  onModulosChange,
  onRemoveExamen,
  onDeleteReserva,
  onCheckConflict,
  draggedExamen = null,
  dropTargetCell = null,
  hoverTargetCell = null,
  refreshExamenesDisponibles,
}) {
  // ASEGURAR: Que estamos usando las reservas más actualizadas del store
  const reservasFromStore = useSelector((state) => state.reservas.lista);

  // Usar las reservas del store en lugar de las del prop
  const reservasActualizadas = reservas || reservasFromStore;

  // USAR EL HOOK: Centralizar toda la lógica de datos
  const { getCellData, shouldRenderExamen, checkConflict } = useCalendarData({
    reservas: reservasActualizadas, // Usar las reservas actualizadas
    selectedSala,
    selectedExam,
    modulosSeleccionados,
    modulos,
  });

  const dispatch = useDispatch();

  // Calcular fecha y hora actuales una sola vez por render
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const nowStr = useMemo(() => format(new Date(), 'HH:mm'), []);

  // Helper: ¿está la fecha fuera de todos los períodos activos?
  const esFueraPeriodo = useMemo(() => {
    if (!periodosActivos || periodosActivos.length === 0) return () => false;
    return (fecha) =>
      !periodosActivos.some(
        (p) => fecha >= p.FECHA_INICIO && fecha <= p.FECHA_FIN
      );
  }, [periodosActivos]);

  // Handler para cambios de estado de reservas - MEJORADO
  const handleReservaStateChange = (reservaId, nuevoEstado, info) => {
    console.log(`[CalendarGrid] Cambio de estado de reserva ${reservaId}:`, {
      nuevoEstado,
      info,
    });

    if (nuevoEstado === 'ELIMINADO') {
      // Remover la reserva del estado local
      dispatch(eliminarReserva(reservaId));
      console.log(
        `[CalendarGrid] Acción eliminarReserva despachada para reserva ${reservaId}`
      );

      // Si hay callback para refrescar exámenes disponibles, usarlo
      // if (info.examen_id && refreshExamenesDisponibles) {
      //   console.log(
      //     `[CalendarGrid] Refrescando exámenes disponibles para examen ${info.examen_id}`
      //   );
      //   setTimeout(() => refreshExamenesDisponibles(), 100);
      // }

      // Mostrar mensaje de éxito más discreto
      console.log(`✅ ${info.message}`);
    } else if (nuevoEstado === 'PENDIENTE') {
      // Actualizar el estado local de la reserva
      dispatch(
        actualizarEstadoConfirmacionReserva({
          id_reserva: reservaId,
          nuevo_estado_confirmacion_docente: 'PENDIENTE',
        })
      );
      console.log(
        `[CalendarGrid] Acción actualizarEstadoConfirmacionReserva despachada para ${reservaId} a PENDIENTE`
      );

      // Mostrar mensaje informativo más discreto
      console.log(`📋 ${info.message}`);
    }
  };

  if (!modulos || modulos.length === 0) {
    return <p className="aviso-seleccion">No hay módulos para mostrar.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="calendar-table">
        <CalendarHeader fechas={fechas} feriadosData={feriadosData} />
        <tbody>
          {modulos.map((modulo) => (
            <tr key={modulo.ID_MODULO}>
              <td className="orden-col">{modulo.ORDEN}</td>
              <td className="horario-col">
                {modulo.INICIO_MODULO} - {modulo.FIN_MODULO}
              </td>
              {fechas.map(({ fecha, esSeleccionado }) => {
                const cellData = getCellData(fecha, modulo.ORDEN);
                const shouldRender = shouldRenderExamen(cellData);

                const esHoverTarget =
                  hoverTargetCell?.fecha === fecha &&
                  hoverTargetCell?.modulo?.ORDEN === modulo.ORDEN;

                const esDropTarget =
                  dropTargetCell?.fecha === fecha &&
                  dropTargetCell?.modulo?.ORDEN === modulo.ORDEN;

                // Bloqueo por pasado: fecha anterior a hoy, o hoy con módulo ya iniciado
                const isPasado =
                  fecha < todayStr ||
                  (fecha === todayStr && modulo.INICIO_MODULO <= nowStr);

                // Bloqueo por período: fuera del rango habilitado (solo si no es pasado)
                const fueraPeriodo = !isPasado && esFueraPeriodo(fecha);

                return (
                  <CalendarCell
                    key={`${fecha}-${modulo.ID_MODULO}`}
                    fecha={fecha}
                    modulo={modulo}
                    feriadoInfo={
                      feriadosData.find((f) => f.FECHA_FERIADO === fecha) ||
                      null
                    }
                    salaId={selectedSala?.ID_SALA}
                    cellData={cellData}
                    shouldRenderExamen={shouldRender}
                    esDiaSeleccionado={esSeleccionado}
                    onSelectModulo={onSelectModulo}
                    onModulosChange={onModulosChange}
                    onRemoveExamen={onRemoveExamen}
                    onDeleteReserva={onDeleteReserva}
                    onCheckConflict={checkConflict}
                    esDropTarget={esDropTarget}
                    esHoverTarget={esHoverTarget}
                    draggedExamen={draggedExamen}
                    onReservaStateChange={handleReservaStateChange}
                    isPasado={isPasado}
                    fueraPeriodo={fueraPeriodo}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
