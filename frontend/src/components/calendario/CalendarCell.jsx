import React from 'react';
import { format } from 'date-fns';
import { useDroppable } from '@dnd-kit/core'; // Importar useDroppable

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
    id: `celda-${format(new Date(fecha), 'yyyy-MM-dd')}-${modulo.ID_MODULO}`, // ID único para la celda
    data: {
      // Datos asociados a esta zona "soltable"
      type: 'celda-calendario',
      fecha: format(new Date(fecha), 'yyyy-MM-dd'), // Guardar fecha formateada
      modulo: modulo, // Guardar el objeto módulo completo
    },
  });

  const estaReservado = reservas.some(
    (r) =>
      r.SALA_ID_SALA === selectedSala?.ID_SALA &&
      format(new Date(r.FECHA_RESERVA), 'yyyy-MM-dd') ===
        format(new Date(fecha), 'yyyy-MM-dd') &&
      r.Modulos.some((m) => m.MODULO_ID_MODULO === modulo.ID_MODULO)
  );

  const estaSeleccionado = modulosSeleccionados.some(
    (m) =>
      m.fecha === format(new Date(fecha), 'yyyy-MM-dd') &&
      m.numero === modulo.ORDEN
  );

  let cellClassName = 'calendar-cell';
  if (estaReservado) {
    cellClassName += ' reservado';
  } else if (estaSeleccionado) {
    cellClassName += ' seleccionado';
  }

  // Estilo para feedback visual cuando se arrastra sobre la celda
  const droppableStyle = {
    backgroundColor: isOver ? '#e6f7ff' : undefined, // Cambia el fondo si algo se arrastra encima
    border: isOver ? '2px dashed #1890ff' : '1px solid #ddd', // Cambia el borde
    // Asegúrate que el padding y otros estilos no se rompan
  };

  return (
    <td
      ref={setNodeRef} // Aplicar la referencia para dnd-kit
      className={cellClassName}
      style={droppableStyle} // Aplicar estilo de "soltable"
      onClick={() =>
        !estaReservado &&
        onSelectModulo(format(new Date(fecha), 'yyyy-MM-dd'), modulo.ORDEN)
      }
    >
      {/* Contenido de la celda, si lo hubiera */}
    </td>
  );
}
