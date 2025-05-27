import React from 'react';
import { useDrop } from 'react-dnd';

export default function CalendarCell({
  fecha,
  modulo,
  selectedSala,
  selectedExam,
  reservas,
  modulosSeleccionados,
  onSelectModulo,
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'EXAM',
    canDrop: () => !!selectedSala && !!selectedExam,
    drop: () => onSelectModulo(fecha, modulo.ORDEN),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const highlight = isOver
    ? canDrop
      ? { backgroundColor: 'lightgreen' }
      : { backgroundColor: 'lightcoral' }
    : {};

  // Reserva existente
  const reserva = reservas.find(
    (r) =>
      r.SALA_ID_SALA === selectedSala?.ID_SALA &&
      r.FECHA_RESERVA.slice(0, 10) === fecha &&
      r.Modulos.some((m) => m.MODULO_ID_MODULO === modulo.ID_MODULO)
  );

  if (reserva) {
    return (
      <td ref={dropRef} style={highlight} className="reservado">
        <div>
          <span>{reserva.Examen?.NOMBRE_EXAMEN}</span>
        </div>
      </td>
    );
  }

  const estaSel = modulosSeleccionados.some(
    (m) => m.fecha === fecha && m.numero === modulo.ORDEN
  );

  return (
    <td
      ref={dropRef}
      style={highlight}
      className={estaSel ? 'seleccionado' : 'disponible'}
    >
      <button
        disabled={!selectedSala || !selectedExam}
        onClick={() => onSelectModulo(fecha, modulo.ORDEN)}
      >
        {estaSel ? '👌' : '➕'}
      </button>
    </td>
  );
}
