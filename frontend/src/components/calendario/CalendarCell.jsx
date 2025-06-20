import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import './styles/Calendar.css';
import ExamenPostIt from './ExamenPostIt';

export default function CalendarCell({
  fecha,
  modulo,
  salaId, // Asegurarse de que esta prop se pasa desde el componente padre
  cellData,
  shouldRenderExamen,
  esDiaSeleccionado,
  onSelectModulo,
  onModulosChange,
  onRemoveExamen,
  onDeleteReserva,
  onCheckConflict,
  esDropTarget,
  esHoverTarget,
  draggedExamen,
  onReservaStateChange, // ← NUEVA PROP
}) {
  const droppableId = `droppable-${fecha}-${modulo.ORDEN}`;

  const { setNodeRef } = useDroppable({
    id: droppableId,
    // Incluir todos los datos necesarios para la creación de la reserva
    data: {
      type: 'celda-calendario',
      fecha,
      modulo: modulo, // Pasar el objeto completo del módulo
      moduloId: modulo.ID_MODULO,
      salaId, // Incluir el ID de la sala
      orden: modulo.ORDEN, // Incluir el orden para facilitar la selección de módulos consecutivos
    },
  });

  // CORREGIR: Estados de celda - usar esHoverTarget en lugar de isOver
  const cellState = {
    ocupada: !!cellData,
    reservada: cellData?.tipo === 'reserva',
    seleccionada: cellData?.tipo === 'temporal',
    partOfExamen: cellData && !shouldRenderExamen,
    dropHover: esHoverTarget, // ← CAMBIO CRÍTICO: Solo usar esHoverTarget
    diaSeleccionado: esDiaSeleccionado,
  };

  // SIMPLIFICAR: Generación de clases CSS
  const getCellClassName = () => {
    const classes = ['calendar-cell'];

    if (cellState.reservada) classes.push('reservado');
    else if (cellState.seleccionada) classes.push('seleccionado');

    if (cellState.dropHover) classes.push('drop-hover'); // ← Ahora solo se activa con esHoverTarget
    if (cellState.partOfExamen) classes.push('part-of-examen');
    if (cellState.diaSeleccionado) classes.push('dia-seleccionado');

    if (shouldRenderExamen && cellData) {
      classes.push('con-examen');
    }
    return classes.join(' ');
  };
  // Log para depuración de clases y cellData
  if (
    cellData &&
    cellData.reservaCompleta &&
    cellData.reservaCompleta.ID_RESERVA === 175
  ) {
    // Log para la reserva específica
    console.log(
      `[CalendarCell DEBUG 175] fecha=${fecha}, modulo.ORDEN=${modulo?.ORDEN}, cellData:`,
      JSON.parse(JSON.stringify(cellData || null)),
      `Clases: ${getCellClassName()}`
    );
  }

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
      data-modulo-id={modulo.ID_MODULO}
      data-fecha={fecha}
    >
      {/* Contenido existente de la celda */}
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
          reservacompleta={cellData.reservaCompleta}
          onReservaStateChange={onReservaStateChange}
          style={{
            position: 'absolute',
            height: `${cellData.modulosTotal * 40}px`,
            width: '100%',
            zIndex: 10,
          }}
        />
      )}

      {/* NUEVO: Preview del examen siendo arrastrado */}
      {esHoverTarget && draggedExamen && !cellData && (
        <div className="drag-preview">
          <ExamenPostIt
            examen={draggedExamen}
            isPreview={true}
            moduloscount={draggedExamen.CANTIDAD_MODULOS_EXAMEN || 3}
            style={{
              position: 'absolute',
              height: `${(draggedExamen.CANTIDAD_MODULOS_EXAMEN || 3) * 40}px`,
              width: '100%',
              opacity: 0.7,
              zIndex: 5,
            }}
          />
        </div>
      )}
    </td>
  );
}
