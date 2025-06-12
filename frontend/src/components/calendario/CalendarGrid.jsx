import React from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarCell from './CalendarCell';
import { useCalendarData } from '../../hooks/useCalendarData';

export default function CalendarGrid({
  fechas,
  modulos,
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
  // ← AGREGAR ESTAS NUEVAS PROPS
  setReservas,
  refreshExamenesDisponibles,
}) {
  // USAR EL HOOK: Centralizar toda la lógica de datos
  const { getCellData, shouldRenderExamen, checkConflict } = useCalendarData({
    reservas,
    selectedSala,
    selectedExam,
    modulosSeleccionados,
    modulos,
  });

  // Handler para cambios de estado de reservas - MEJORADO
  const handleReservaStateChange = (reservaId, nuevoEstado, info) => {
    console.log(`[CalendarGrid] Cambio de estado de reserva ${reservaId}:`, {
      nuevoEstado,
      info,
    });

    if (nuevoEstado === 'ELIMINADO') {
      // Remover la reserva del estado local
      if (setReservas) {
        setReservas((prev) => {
          const reservaEliminada = prev.find((r) => r.ID_RESERVA === reservaId);
          const nuevasReservas = prev.filter((r) => r.ID_RESERVA !== reservaId);

          console.log(
            `[CalendarGrid] Reserva ${reservaId} eliminada del estado local`
          );

          // Si hay callback para refrescar exámenes disponibles, usarlo
          if (info.examen_id && refreshExamenesDisponibles) {
            console.log(
              `[CalendarGrid] Refrescando exámenes disponibles para examen ${info.examen_id}`
            );
            setTimeout(() => refreshExamenesDisponibles(), 100);
          }

          return nuevasReservas;
        });
      }

      // Mostrar mensaje de éxito más discreto
      console.log(`✅ ${info.message}`);
    } else if (nuevoEstado === 'PENDIENTE') {
      // Actualizar el estado local de la reserva
      if (setReservas) {
        setReservas((prev) =>
          prev.map((r) =>
            r.ID_RESERVA === reservaId
              ? { ...r, ESTADO_CONFIRMACION_DOCENTE: 'PENDIENTE' }
              : r
          )
        );
      }

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
        <CalendarHeader fechas={fechas} />
        <tbody>
          {modulos.map((modulo) => (
            <tr key={modulo.ID_MODULO}>
              <td className="orden-col">{modulo.ORDEN}</td>
              <td className="horario-col">
                {modulo.INICIO_MODULO} - {modulo.FIN_MODULO}
              </td>
              {fechas.map(({ fecha, esSeleccionado }) => {
                // USAR EL HOOK: Obtener datos pre-calculados
                const cellData = getCellData(fecha, modulo.ORDEN);
                const shouldRender = shouldRenderExamen(cellData);

                // SEPARAR: hover preview vs drop target
                const esHoverTarget =
                  hoverTargetCell?.fecha === fecha &&
                  hoverTargetCell?.modulo?.ORDEN === modulo.ORDEN;

                const esDropTarget =
                  dropTargetCell?.fecha === fecha &&
                  dropTargetCell?.modulo?.ORDEN === modulo.ORDEN;

                return (
                  <CalendarCell
                    key={`${fecha}-${modulo.ID_MODULO}`}
                    fecha={fecha}
                    modulo={modulo}
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
                    // ← PASAR EL HANDLER A CalendarCell
                    onReservaStateChange={handleReservaStateChange}
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
