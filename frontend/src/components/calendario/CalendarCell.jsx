import React, { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import './styles/Calendar.css';
import ExamenPostIt from './ExamenPostIt';

export default function CalendarCell({
  fecha,
  modulo,
  salaId,
  feriadoInfo = null,
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
  onReservaStateChange,
  isPasado = false,
  fueraPeriodo = false,
}) {
  const droppableId = `droppable-${fecha}-${modulo.ORDEN}`;

  const isBlocked = isPasado || fueraPeriodo;

  const { setNodeRef } = useDroppable({
    id: droppableId,
    disabled: isBlocked,
    data: {
      type: 'celda-calendario',
      fecha,
      modulo: modulo,
      moduloId: modulo.ID_MODULO,
      salaId,
      orden: modulo.ORDEN,
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

    if (feriadoInfo?.TIPO_BLOQUEO === 'COMPLETO')
      classes.push('feriado-completo');
    else if (
      feriadoInfo?.TIPO_BLOQUEO === 'MODULOS' &&
      feriadoInfo.MODULOS_IDS?.includes(modulo.ID_MODULO)
    )
      classes.push('feriado-modulo');

    if (isPasado) classes.push('pasado');
    else if (fueraPeriodo) classes.push('fuera-periodo');

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

  // SIMPLIFICAR: Manejador de clic
  const handleClick = () => {
    if (feriadoInfo?.TIPO_BLOQUEO === 'COMPLETO') return;
    if (isBlocked) return;
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
