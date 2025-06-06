import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import './styles/Calendar.css';
import ExamenPostIt from './ExamenPostIt';

const CalendarCell = memo(function CalendarCell({
  fecha,
  modulo,
  cellData, // ← NUEVA PROP: datos pre-calculados
  shouldRenderExamen, // ← NUEVA PROP: decisión pre-calculada
  esDiaSeleccionado,
  onSelectModulo,
  onModulosChange,
  onRemoveExamen,
  onDeleteReserva,
  onCheckConflict,
  esDropTarget,
}) {
  const droppableId = `droppable-${fecha}-${modulo.ORDEN}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: 'celda-calendario', fecha, modulo },
  });

  // SIMPLIFICAR: Estados de celda pre-calculados
  const cellState = {
    ocupada: !!cellData,
    reservada: cellData?.tipo === 'reserva',
    seleccionada: cellData?.tipo === 'temporal',
    partOfExamen: cellData && !shouldRenderExamen,
    dropHover: isOver || esDropTarget,
    diaSeleccionado: esDiaSeleccionado,
  };

  // SIMPLIFICAR: Generación de clases CSS
  const getCellClassName = () => {
    const classes = ['calendar-cell'];

    if (cellState.reservada) classes.push('reservado');
    else if (cellState.seleccionada) classes.push('seleccionado');

    if (cellState.dropHover) classes.push('drop-hover');
    if (cellState.partOfExamen) classes.push('part-of-examen');
    if (cellState.diaSeleccionado) classes.push('dia-seleccionado');

    return classes.join(' ');
  };

  // SIMPLIFICAR: Manejador de clic
  const handleClick = () => {
    if (!cellState.ocupada && onSelectModulo) {
      onSelectModulo(fecha, modulo.ORDEN);
    }
  };

  return (
    <td
      ref={setNodeRef}
      className={getCellClassName()}
      onClick={handleClick}
      data-celda-id={droppableId}
    >
      {shouldRenderExamen && cellData && (
        <ExamenPostIt
          examen={cellData.examen}
          moduloscount={cellData.modulosTotal}
          esReservaConfirmada={cellData.tipo === 'reserva'}
          onModulosChange={onModulosChange}
          onRemove={onRemoveExamen}
          onDeleteReserva={onDeleteReserva}
          onCheckConflict={onCheckConflict}
          fecha={fecha}
          moduloInicial={cellData.moduloInicial}
          examenAsignadoCompleto={cellData}
          reservacompleta={cellData.reservaCompleta} // ← CAMBIAR: era reservacompleta, ahora reservaCompleta
          style={{
            position: 'absolute',
            height: `${cellData.modulosTotal * 40}px`,
            width: '100%',
            zIndex: 10,
          }}
        />
      )}
    </td>
  );
});

export default CalendarCell;
