import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import Layout from '../components/Layout';
import DragFeedback from '../components/calendario/DragFeedback';
import './CalendarioPage.css';

export function CalendarioPage() {
  const [draggedExamen, setDraggedExamen] = useState(null);
  const [dropTargetCell, setDropTargetCell] = useState(null);
  const [hoverTargetCell, setHoverTargetCell] = useState(null); // Nueva variable para hover

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 }, // Reactivar para mejor UX
    })
  );

  const handleDragStart = (event) => {
    console.log('Drag Start detected:', event);
    // Guardar el examen que se está arrastrando
    if (event.active.data.current?.type === 'examen') {
      setDraggedExamen(event.active.data.current.examen);
    }
    setDropTargetCell(null);
    setHoverTargetCell(null); // Limpiar hover
  };

  // Este maneja solo el feedback visual, NO el procesamiento
  const handleDragOver = (event) => {
    const { over } = event;

    if (over && over.data.current?.type === 'celda-calendario') {
      setHoverTargetCell(over.data.current); // Solo para feedback visual
    } else {
      setHoverTargetCell(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    console.log('Drag ended:', { active, over });

    // Limpiar hover inmediatamente
    setHoverTargetCell(null);

    // Si hay un drop válido, AQUÍ es donde se procesa realmente
    if (
      over &&
      active.data.current?.type === 'examen' &&
      over.data.current?.type === 'celda-calendario'
    ) {
      console.log('Valid drop detected!');
      // Solo aquí se activa el procesamiento real
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
    setHoverTargetCell(null);
  };

  return (
    <Layout>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="container-fluid mt-3 calendario-page-container">
          <AgendaSemanal
            draggedExamen={draggedExamen}
            dropTargetCell={dropTargetCell} // Solo para procesamiento real
            onDropProcessed={handleDropProcessed}
          />

          {/* Usar hoverTargetCell para feedback visual */}
          <DragFeedback
            draggedExamen={draggedExamen}
            dropTargetCell={hoverTargetCell} // Feedback con hover, no con drop real
          />
        </div>
      </DndContext>
    </Layout>
  );
}

export default CalendarioPage;
