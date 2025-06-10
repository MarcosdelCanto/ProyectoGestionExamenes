import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core';
import AgendaSemanal from '../components/calendario/AgendaSemanal';
import Layout from '../components/Layout';
import DragFeedback from '../components/calendario/DragFeedback';
import ExamenPostIt from '../components/calendario/ExamenPostIt';
import './CalendarioPage.css';

export function CalendarioPage() {
  // ESTADOS ORIGINALES
  const [draggedExamen, setDraggedExamen] = useState(null);
  const [activeDraggableExamen, setActiveDraggableExamen] = useState(null);
  const [dropTargetCell, setDropTargetCell] = useState(null);
  const [hoverTargetCell, setHoverTargetCell] = useState(null);

  // NUEVO: Tracking de posición del mouse
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // SENSORES
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
      },
    })
  );

  // TRACKING DEL MOUSE durante drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);

  // DRAG START
  const handleDragStart = (event) => {
    console.log('🔄 Drag start:', event);

    const { active } = event;
    if (!active || !active.data.current) return;

    const examenData = active.data.current;

    if (examenData.type === 'examen' && examenData.examen) {
      console.log('✅ Examen encontrado para drag:', examenData.examen);
      setActiveDraggableExamen(examenData.examen);
      setIsDragging(true); // ← Activar tracking del mouse
    }
  };

  // FUNCIÓN PARA VERIFICAR SI EL MOUSE ESTÁ DENTRO DEL CALENDARIO
  const isMouseInsideCalendar = useCallback(() => {
    const calendarTable = document.querySelector('.calendar-table');
    if (!calendarTable) {
      console.log('❌ Tabla del calendario no encontrada');
      return false;
    }

    const tableRect = calendarTable.getBoundingClientRect();

    // Verificar que el mouse está dentro del área de la tabla
    const isInside =
      mousePosition.x >= tableRect.left + 10 && // Margen de 10px
      mousePosition.x <= tableRect.right - 10 &&
      mousePosition.y >= tableRect.top + 10 &&
      mousePosition.y <= tableRect.bottom - 10;

    console.log('🎯 Verificación posición mouse:', {
      mouseX: mousePosition.x,
      mouseY: mousePosition.y,
      tableLeft: tableRect.left,
      tableRight: tableRect.right,
      tableTop: tableRect.top,
      tableBottom: tableRect.bottom,
      isInside: isInside,
    });

    return isInside;
  }, [mousePosition]);

  // DRAG OVER - Con verificación de posición real del mouse
  const handleDragOver = (event) => {
    const { over } = event;

    console.log('🔍 DragOver:', {
      hasOver: !!over,
      overType: over?.data?.current?.type,
      overId: over?.id,
      isDragging: isDragging,
    });

    // Solo procesar si estamos arrastrando algo
    if (!isDragging || !activeDraggableExamen) {
      setHoverTargetCell(null);
      return;
    }

    // Verificar que hay una celda válida bajo el cursor
    if (over && over.data.current?.type === 'celda-calendario') {
      // VERIFICACIÓN CRÍTICA: ¿Está el mouse realmente dentro del calendario?
      const mouseInsideCalendar = isMouseInsideCalendar();

      if (mouseInsideCalendar) {
        console.log('✅ Mouse dentro del calendario - estableciendo hover');
        setHoverTargetCell(over.data.current);
      } else {
        console.log('❌ Mouse fuera del calendario - limpiando hover');
        setHoverTargetCell(null);
      }
    } else {
      console.log('❌ No hay celda válida bajo cursor');
      setHoverTargetCell(null);
    }
  };

  // DRAG END
  const handleDragEnd = (event) => {
    const { active, over } = event;

    console.log('🏁 Drag end:', {
      activeId: active?.id,
      overId: over?.id,
      activeData: active?.data?.current,
      overData: over?.data?.current,
      mouseInsideCalendar: isMouseInsideCalendar(),
    });

    // LIMPIAR estados de drag
    setActiveDraggableExamen(null);
    setIsDragging(false);
    setHoverTargetCell(null);

    // VERIFICAR que el drop es válido Y que el mouse está dentro del calendario
    const isValidDrop =
      over &&
      active.data.current?.type === 'examen' &&
      over.data.current?.type === 'celda-calendario' &&
      isMouseInsideCalendar(); // ← VERIFICACIÓN ADICIONAL

    if (isValidDrop) {
      console.log('✅ Drop válido dentro del calendario - procesando');
      setDraggedExamen(active.data.current.examen);
      setDropTargetCell(over.data.current);
    } else {
      console.log('❌ Drop inválido o fuera del calendario');
      setDraggedExamen(null);
      setDropTargetCell(null);
    }
  };

  // DRAG CANCEL
  const handleDragCancel = () => {
    setActiveDraggableExamen(null);
    setDraggedExamen(null);
    setDropTargetCell(null);
    setHoverTargetCell(null);
    setIsDragging(false); // ← Detener tracking
    console.log('🚫 Drag cancelado');
  };

  // DROP PROCESSED
  const handleDropProcessed = () => {
    setDraggedExamen(null);
    setDropTargetCell(null);
    setHoverTargetCell(null);
    setIsDragging(false); // ← Detener tracking
  };

  return (
    <div className="calendario-page">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="container-fluid calendario-page-container">
          <AgendaSemanal
            draggedExamen={draggedExamen}
            dropTargetCell={dropTargetCell}
            hoverTargetCell={hoverTargetCell}
            onDropProcessed={handleDropProcessed}
          />

          {/* Feedback solo cuando está siendo arrastrado Y dentro del calendario */}
          <DragFeedback
            draggedExamen={activeDraggableExamen}
            dropTargetCell={hoverTargetCell}
          />

          {/* DEBUG: Mostrar posición del mouse (temporal) */}
          {isDragging && (
            <div
              style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 9999,
                maxWidth: '300px',
              }}
            >
              <div>
                Mouse: {mousePosition.x}, {mousePosition.y}
              </div>
              <div>
                Dentro calendario: {isMouseInsideCalendar() ? '✅' : '❌'}
              </div>
              <div>Hover activo: {hoverTargetCell ? '✅' : '❌'}</div>
              <div>Drop target: {dropTargetCell ? '✅' : '❌'}</div>
              {hoverTargetCell && (
                <div style={{ color: '#90EE90' }}>
                  Hover: {hoverTargetCell.fecha} - M
                  {hoverTargetCell.modulo.ORDEN}
                </div>
              )}
              {dropTargetCell && (
                <div style={{ color: '#FFB6C1' }}>
                  Drop: {dropTargetCell.fecha} - M{dropTargetCell.modulo.ORDEN}
                </div>
              )}
              <div
                style={{ marginTop: '5px', fontSize: '10px', color: '#DDD' }}
              >
                El problema probablemente está en CalendarGrid
              </div>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeDraggableExamen ? (
            <ExamenPostIt
              examen={activeDraggableExamen}
              isPreview={true}
              isDragOverlay={true}
              moduloscount={activeDraggableExamen.CANTIDAD_MODULOS_EXAMEN || 3}
              style={{
                transform: 'rotate(5deg)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default CalendarioPage;
