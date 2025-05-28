import React from 'react';
import { useDrag } from 'react-dnd';
import { FaArrowCircleRight, FaCircle } from 'react-icons/fa';

export default function DraggableExamRow({ exam, onSelect, selectedExam }) {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'EXAM',
    item: { exam },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <tr
      ref={dragRef}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
      className={
        exam.ID_EXAMEN === selectedExam?.ID_EXAMEN ? 'fila-seleccionada' : ''
      }
      onClick={() => onSelect(exam)}
    >
      <td>{exam.SECCION?.NOMBRE_SECCION}</td>
      <td>{exam.ASIGNATURA?.NOMBRE_ASIGNATURA}</td>
      <td>{exam.CANTIDAD_MODULOS_EXAMEN}</td>
      <td>
        {exam.ESTADO_ID_ESTADO === 3 ? (
          <FaCircle className="icono-reservado" />
        ) : (
          <FaArrowCircleRight className="icono" />
        )}
      </td>
    </tr>
  );
}
