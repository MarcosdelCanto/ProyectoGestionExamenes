import React, { useState } from 'react'; // Importar useState
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import Layout from '../components/Layout';
import AgendaSemanal from '../components/AgendaSemanal';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './CalendarioPage.css'; // Importar estilos CSS

// Define o importa 'datosIniciales'
// Ejemplo de definición:
const datosIniciales = [
  { id: '1', contenido: 'Elemento 1' },
  { id: '2', contenido: 'Elemento 2' },
  { id: '3', contenido: 'Elemento 3' },
];

/**
 * Fila arrastrable para cada examen
 * @param {{ id: string, children: React.ReactNode }} props
 */
export function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };
  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
}

function CalendarioPage() {
  const [items, setItems] = useState(datosIniciales);

  // Sensores para detectar el input (puntero y teclado para accesibilidad)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);

        // arrayMove es una función útil de @dnd-kit/sortable
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  }

  return (
    <Layout>
      <div className="container-fluid usuarios-page-container">
        {/* Combinando Bootstrap con una clase personalizada */}
        <h2 className="display-5 page-title-custom mb-4">
          <i className="bi bi-calendar-check me-3"></i>
          Calendario de Exámenes
        </h2>

        {/* Componente de calendario para poder soltar exámenes */}
        <DndProvider backend={HTML5Backend}>
          <AgendaSemanal />
        </DndProvider>
      </div>
    </Layout>
  );
}
export default CalendarioPage;
