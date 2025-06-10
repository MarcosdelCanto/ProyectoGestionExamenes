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
  hoverTargetCell = null, // ← AGREGAR ESTA PROP
}) {
  // USAR EL HOOK: Centralizar toda la lógica de datos
  const { getCellData, shouldRenderExamen, checkConflict } = useCalendarData({
    reservas,
    selectedSala,
    selectedExam,
    modulosSeleccionados,
    modulos,
  });

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
                    esDropTarget={esDropTarget} // ← Solo para procesamiento final
                    esHoverTarget={esHoverTarget} // ← NUEVA: Para preview en tiempo real
                    draggedExamen={draggedExamen} // ← Para mostrar preview del examen
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
