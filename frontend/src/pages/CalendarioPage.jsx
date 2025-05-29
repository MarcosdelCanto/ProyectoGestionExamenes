import React, { useState } from 'react'; // Quitar useEffect, useMemo, useRef si ya no se usan aquí
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import Layout from '../components/Layout';
import '../components/calendario/CalendarioStyles.css';
import './CalendarioPage.css';

// Imports para dnd-kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

export function CalendarioPage() {
  // Los estados de examenes, salas, selectedSalaCalendario, etc., se moverán a AgendaSemanal
  const [draggedExamenData, setDraggedExamenData] = useState(null);
  const [dropTargetCellData, setDropTargetCellData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  // La carga de datos (examenes, salas) se hará dentro de AgendaSemanal
  // useEffect(() => { ... loadData ... }, []); // Ya no aquí

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setDraggedExamenData(null);
    setDropTargetCellData(null);
    if (
      over &&
      active.data.current?.type === 'examen' &&
      over.data.current?.type === 'celda-calendario'
    ) {
      // Es importante que active.data.current.examen contenga el objeto examen completo
      setDraggedExamenData(active.data.current.examen);
      setDropTargetCellData(over.data.current); // Esto debería ser { fecha, modulo }
    }
  };

  const handleDropProcessed = () => {
    setDraggedExamenData(null);
    setDropTargetCellData(null);
  };

  // handleSelectSala y filteredSalas ya no son necesarios aquí

  return (
    <Layout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="container-fluid mt-3 calendario-page-container">
          {/* AgendaSemanal ahora es el componente principal que organiza su interior */}
          <AgendaSemanal
            draggedExamen={draggedExamenData}
            dropTargetCell={dropTargetCellData}
            onDropProcessed={handleDropProcessed}
            // Ya no se pasa externalSelectedSala desde aquí
          />
        </div>
      </DndContext>
    </Layout>
  );
}

export default CalendarioPage;
