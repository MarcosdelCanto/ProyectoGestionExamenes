import React, { memo } from 'react';
import { format } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import './styles/Calendar.css';
import ExamenPostIt from './ExamenPostIt';

const CalendarCell = memo(function CalendarCell({
  fecha,
  modulo,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
  examenAsignado,
  isPartOfExamen,
  onModulosChange,
  onRemoveExamen,
  onCheckConflict, // Asegúrate de incluir esta prop
  modulosCount,
}) {
  // Configuración de la zona donde se puede soltar - un punto crucial
  const droppableId = `droppable-${fecha}-${modulo.ORDEN}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      type: 'celda-calendario',
      fecha,
      modulo,
    },
  });

  // Verificación de reservas
  const estaReservado = reservas.some(
    (r) =>
      r.SALA_ID_SALA === selectedSala?.ID_SALA &&
      format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
      r.Modulos.some((m) => m.MODULO_ID_MODULO === modulo.ID_MODULO)
  );

  // Verificación de selección
  const estaSeleccionado = modulosSeleccionados.some(
    (m) => m.fecha === fecha && m.numero === modulo.ORDEN
  );

  // Clases CSS
  let cellClassName = 'calendar-cell';
  if (estaReservado) {
    cellClassName += ' reservado';
  } else if (estaSeleccionado) {
    cellClassName += ' seleccionado';
  }
  if (isOver) {
    cellClassName += ' drop-hover';
  }
  if (isPartOfExamen && !examenAsignado) {
    cellClassName += ' part-of-examen';
  }
  if (examenAsignado) {
    cellClassName += ' contains-examen';
  }

  // Manejador de clic
  const handleClick = () => {
    if (!estaReservado && !isPartOfExamen && onSelectModulo) {
      onSelectModulo(fecha, modulo.ORDEN);
    }
  };

  return (
    <td
      ref={setNodeRef}
      className={cellClassName}
      onClick={handleClick}
      data-celda-id={droppableId}
    >
      {examenAsignado ? (
        <ExamenPostIt
          examen={examenAsignado.examen}
          modulosCount={examenAsignado.modulosCount}
          onModulosChange={
            onModulosChange
              ? (id, count) => onModulosChange(id, count)
              : undefined
          }
          onRemove={onRemoveExamen}
          onCheckConflict={onCheckConflict} // Asegúrate de pasar esta prop
          isPreview={false}
          fecha={fecha}
          moduloInicial={examenAsignado.moduloInicial}
          style={{
            position: 'absolute',
            height: `${examenAsignado.modulosCount * 40}px`,
            width: '100%',
            zIndex: 10,
          }}
        />
      ) : null}
    </td>
  );
});

export default CalendarCell;
