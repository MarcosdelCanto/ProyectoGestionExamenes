import React, { useState, useEffect } from 'react';
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import ExamenSelector from '../components/calendario/ExamenSelector';
import Layout from '../components/Layout';
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
// closestCenter es un algoritmo de colisión, puedes probar otros como pointerWithin

export default function CalendarioPage() {
  const [examenes, setExamenes] = useState([]);
  const [isLoadingExamenes, setIsLoadingExamenes] = useState(true);
  const [draggedExamenData, setDraggedExamenData] = useState(null);
  const [dropTargetCellData, setDropTargetCellData] = useState(null);

  // Sensores para dnd-kit (para interacciones de puntero y teclado)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Pequeño retraso para evitar que el D&D se active con un simple clic en Swiper
        // Ajusta o elimina si causa problemas con Swiper
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    async function loadExamenes() {
      setIsLoadingExamenes(true);
      try {
        const res = await fetch('/api/examenes'); // <-- TU ENDPOINT REAL AQUÍ
        if (!res.ok) {
          const errorData = await res.text(); // O res.json() si tu API devuelve JSON en errores
          throw new Error(
            `Error al cargar exámenes: ${res.status} ${errorData}`
          );
        }
        const data = await res.json();
        setExamenes(data);
      } catch (err) {
        console.error('Error cargando exámenes:', err);
        setExamenes([]); // Considera un mejor manejo de errores
      } finally {
        setIsLoadingExamenes(false);
      }
    }
    loadExamenes();
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Limpiar estados previos en caso de que no se suelte sobre un destino válido
    setDraggedExamenData(null);
    setDropTargetCellData(null);

    if (
      over &&
      active.data.current?.type === 'examen' &&
      over.data.current?.type === 'celda-calendario'
    ) {
      setDraggedExamenData(active.data.current.examen); // El objeto examen completo
      setDropTargetCellData(over.data.current); // { type, fecha, modulo }
    }
  };

  // Función para que AgendaSemanal notifique que ha procesado el drop
  const handleDropProcessed = () => {
    setDraggedExamenData(null);
    setDropTargetCellData(null);
  };

  return (
    <Layout>
      {/* DndContext envuelve todos los componentes que participan en D&D */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter} // O prueba con pointerWithin
        onDragEnd={handleDragEnd}
      >
        <div className="page-calendario">
          <ExamenSelector
            examenes={examenes}
            isLoadingExamenes={isLoadingExamenes}
            // ...otras props para filtros
          />
          <AgendaSemanal
            // Pasar los datos del D&D y la callback
            draggedExamen={draggedExamenData}
            dropTargetCell={dropTargetCellData}
            onDropProcessed={handleDropProcessed}
            // Pasar la lista de examenes si AgendaSemanal la necesita para la lógica de drop
            // (ej. para obtener el objeto examen completo si solo se pasara el ID)
            // Pero como ya pasamos el objeto examen completo en draggedExamenData, no sería estrictamente necesario
            // examenesOriginales={examenes}
          />
        </div>
      </DndContext>
    </Layout>
  );
}
