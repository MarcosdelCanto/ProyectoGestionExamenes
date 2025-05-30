import React from 'react';
import { format } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import './CalendarioStyles.css';

export default function CalendarCell({
  fecha,
  modulo,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${fecha}-${modulo.ORDEN}`,
    data: {
      type: 'celda-calendario',
      fecha,
      modulo,
    },
  });

  const estaReservado = reservas.some(
    (r) =>
      r.SALA_ID_SALA === selectedSala?.ID_SALA &&
      format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') === fecha &&
      r.Modulos.some((m) => m.MODULO_ID_MODULO === modulo.ID_MODULO)
  );

  const estaSeleccionado = modulosSeleccionados.some(
    (m) => m.fecha === fecha && m.numero === modulo.ORDEN
  );

  let cellClassName = 'calendar-cell';
  if (estaReservado) {
    cellClassName += ' reservado';
  } else if (estaSeleccionado) {
    cellClassName += ' seleccionado';
  }
  if (isOver) {
    cellClassName += ' drop-hover';
  }

  return (
    <td
      ref={setNodeRef}
      className={cellClassName}
      onClick={() => !estaReservado && onSelectModulo(fecha, modulo.ORDEN)}
    >
      {/* Contenido opcional de la celda */}
    </td>
  );
}
