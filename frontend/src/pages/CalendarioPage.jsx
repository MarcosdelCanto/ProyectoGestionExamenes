import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import Layout from '../components/Layout';
import './CalendarioPage.css';

export function CalendarioPage() {
  const [draggedExamen, setDraggedExamen] = useState(null);
  const [dropTargetCell, setDropTargetCell] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Temporalmente sin activationConstraint para prueba
      // activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  const handleDragStart = (event) => {
    console.log('Drag Start detected:', event);
    setDraggedExamen(null);
    setDropTargetCell(null);
  };

  // Manejador de fin de arrastre
  const handleDragEnd = (event) => {
    const { active, over } = event;
    console.log('Drag ended:', { active, over });

    // Si hay un drop válido
    if (
      over &&
      active.data.current?.type === 'examen' &&
      over.data.current?.type === 'celda-calendario'
    ) {
      console.log('Valid drop detected!');
      // Configurar el estado para procesar el drop
      setDraggedExamen(active.data.current.examen);
      setDropTargetCell(over.data.current);
    } else {
      // Si no hay drop válido, limpiar estados
      setDraggedExamen(null);
      setDropTargetCell(null);
    }
  };

  const handleDropProcessed = () => {
    setDraggedExamen(null);
    setDropTargetCell(null);
  };

  // handleSelectSala y filteredSalas ya no son necesarios aquí

  return (
    <Layout>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="container-fluid mt-3 calendario-page-container">
          {/* AgendaSemanal ahora es el componente principal que organiza su interior */}
          <AgendaSemanal
            draggedExamen={draggedExamen}
            dropTargetCell={dropTargetCell}
            onDropProcessed={handleDropProcessed}
          />
        </div>
      </DndContext>
    </Layout>
  );
}

export default CalendarioPage;
