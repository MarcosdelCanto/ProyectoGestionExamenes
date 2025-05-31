import React, { memo } from 'react'; // Usar memo para evitar rerenderizados innecesarios
import { format } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import './CalendarioStyles.css';
import ExamenPostIt from './ExamenPostIt'; // Usar el mismo componente ExamenPostIt

const CalendarCell = memo(function CalendarCell({
  fecha,
  modulo,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
  examenAsignado,
  onModulosChange,
  onRemoveExamen,
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
  if (examenAsignado) {
    cellClassName += ' con-examen';
  }

  // Manejador de clic
  const handleClick = () => {
    if (!estaReservado && !examenAsignado && onSelectModulo) {
      onSelectModulo(fecha, modulo.ORDEN);
    }
  };

  // Añadir atributo data-modulos para controlar la altura cuando hay examen asignado
  const dataProps = examenAsignado
    ? { 'data-modulos': examenAsignado.modulosCount }
    : {};

  return (
    <td
      ref={setNodeRef}
      className={cellClassName}
      onClick={handleClick}
      data-celda-id={droppableId}
      {...dataProps}
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
          isPreview={false}
        />
      ) : null}
    </td>
  );
});

export default CalendarCell;
