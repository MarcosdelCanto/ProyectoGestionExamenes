import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay, // 1. Importar DragOverlay
} from '@dnd-kit/core';
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import Layout from '../components/Layout';
import DragFeedback from '../components/calendario/DragFeedback';
import ExamenPostIt from '../components/calendario/ExamenPostIt'; // 1. Importar ExamenPostIt para el overlay
import './CalendarioPage.css';

export function CalendarioPage() {
  const [draggedExamen, setDraggedExamen] = useState(null); // Se mantiene para la lógica de drop en AgendaSemanal y DragFeedback
  const [activeDraggableExamen, setActiveDraggableExamen] = useState(null); // 2. Nuevo estado para el examen en DragOverlay
  const [dropTargetCell, setDropTargetCell] = useState(null);
  const [hoverTargetCell, setHoverTargetCell] = useState(null); // Nueva variable para hover

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 }, // Reactivar para mejor UX
    })
  );

  const handleDragStart = (event) => {
    console.log('Drag Start detected:', event);
    if (event.active.data.current?.type === 'examen') {
      // Para la lógica de drop y el feedback de texto
      setDraggedExamen(event.active.data.current.examen);
      // Para la visualización en DragOverlay
      setActiveDraggableExamen(event.active.data.current.examen); // 3. Poblar estado para DragOverlay
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
    setActiveDraggableExamen(null); // 3. Limpiar estado de DragOverlay al finalizar el arrastre

    // Si hay un drop válido, AQUÍ es donde se procesa realmente
    if (
      over &&
      active.data.current?.type === 'examen' &&
      over.data.current?.type === 'celda-calendario'
    ) {
      console.log('Valid drop detected!');
      // Solo aquí se activa el procesamiento real
      setDraggedExamen(active.data.current.examen); // Asegurar que draggedExamen se mantiene para AgendaSemanal
      setDropTargetCell(over.data.current);
    } else {
      // Si no hay drop válido, limpiar estados
      setDraggedExamen(null);
      setDropTargetCell(null);
    }
  };

  // Opcional: Manejar cancelación del arrastre (ej. presionando Escape)
  const handleDragCancel = () => {
    setActiveDraggableExamen(null); // Limpiar DragOverlay
    setDraggedExamen(null);
    setDropTargetCell(null);
    setHoverTargetCell(null);
    console.log('Drag Cancelled');
  };

  const handleDropProcessed = () => {
    setDraggedExamen(null);
    setDropTargetCell(null);
    setHoverTargetCell(null);
    // activeDraggableExamen ya se limpia en handleDragEnd/handleDragCancel
  };

  return (
    <Layout>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel} // Añadir manejador de cancelación
      >
        <div className="container-fluid calendario-page-container">
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

        {/* 4. Renderizar DragOverlay */}
        <DragOverlay dropAnimation={null}>
          {activeDraggableExamen ? (
            <ExamenPostIt
              examen={activeDraggableExamen}
              isPreview={true}
              // Pasamos isBeingDragged={true} para que pueda aplicar estilos CSS
              // definidos para el estado de arrastre, si los tuviera.
              isBeingDragged={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Layout>
  );
}

export default CalendarioPage;
