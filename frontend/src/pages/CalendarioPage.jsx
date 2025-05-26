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
} from '@dnd-kit/sortable';
import Layout from '../components/Layout';
import { AgendaSemanal } from '../components/AgendaSemanal';

// Define o importa 'datosIniciales'
// Ejemplo de definición:
const datosIniciales = [
  { id: '1', contenido: 'Elemento 1' },
  { id: '2', contenido: 'Elemento 2' },
  { id: '3', contenido: 'Elemento 3' },
];

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
      <div className="App">
        <h1>Examenes</h1>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table>
            <thead>
              <tr>
                <th>Contenido</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <AgendaSemanal key={item.id} id={item.id}>
                    <td>{item.contenido}</td>
                  </AgendaSemanal>
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </Layout>
  );
}
export default CalendarioPage;
