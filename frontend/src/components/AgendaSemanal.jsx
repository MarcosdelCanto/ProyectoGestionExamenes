import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import 'bootstrap/dist/css/bootstrap.min.css';

export function AgendaSemanal() {
  // Lógica y JSX para tu componente AgendaSemanal
  // Podrías usar SortableRow aquí dentro si es parte de una lista más grande.

  function SortableRow({ id, children }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      // El 'transform' y 'transition' son aplicados por Dnd Kit para mover el elemento
      transform: CSS.Transform.toString(transform),
      transition,
      // Añadimos un poco de opacidad mientras se arrastra para un mejor feedback visual
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </tr>
    );
  }
  return (
    <div>
      {/* Ejemplo de cómo podrías usar SortableRow si AgendaSemanal es una tabla */}
      <table>
        <tbody>
          <SortableRow id="fila1">
            <td>Contenido de la fila 1</td>
          </SortableRow>
          <SortableRow id="fila2">
            <td>Contenido de la fila 2</td>
          </SortableRow>
        </tbody>
      </table>
      Contenido de la Agenda Semanal
    </div>
  );
}

export default AgendaSemanal;
