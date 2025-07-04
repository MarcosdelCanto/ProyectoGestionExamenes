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
import { useDispatch } from 'react-redux'; // Importar useDispatch
import { actualizarModulosReservaLocalmente } from '../store/reservasSlice'; // Importar la acción
import { socket } from '../store/socketMiddleware'; // Importar el socket
import ExamenPostIt from '../components/calendario/ExamenPostIt';
import './CalendarioPage.css';

export function CalendarioPage() {
  // Estados existentes
  const [draggedExamen, setDraggedExamen] = useState(null);
  const [activeDraggableExamen, setActiveDraggableExamen] = useState(null);
  const [dropTargetCell, setDropTargetCell] = useState(null);
  const [hoverTargetCell, setHoverTargetCell] = useState(null);

  const dispatch = useDispatch(); // Hook para despachar acciones de Redux
  const [dragOverlayStyle, setDragOverlayStyle] = useState({}); // Estado para el estilo del overlay
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

  // Esta función se pasará a AgendaSemanal como prop, y de ahí a CalendarGrid, etc.
  const handleModulosChangeGlobal = useCallback(
    (reservaId, nuevaCantidadModulos) => {
      console.log(
        `[CalendarioPage] handleModulosChangeGlobal: reservaId=${reservaId}, nuevaCantidad=${nuevaCantidadModulos}`
      );

      // 1. Actualizar Redux localmente para el cliente actual
      dispatch(
        actualizarModulosReservaLocalmente({
          id_reserva: reservaId,
          nuevaCantidadModulos,
        })
      );

      // 2. Emitir evento de Socket.IO al servidor
      // El nombre del evento debe ser consistente con el backend
      socket.emit('cambioModulosTemporalClienteAlServidor', {
        id_reserva: reservaId, // Usar el id_reserva recibido
        nuevaCantidadModulos,
      });
      console.log(
        `[CalendarioPage] Evento 'cambioModulosTemporalClienteAlServidor' emitido para reserva ${reservaId}, nueva cantidad: ${nuevaCantidadModulos}`
      );
    },
    [dispatch]
  );

  // DRAG START
  const handleDragStart = (event) => {
    console.log('🔄 Drag start:', event);

    const { active } = event;
    if (!active || !active.data.current) return;

    const examenData = active.data.current;

    if (examenData.type === 'examen' && examenData.examen) {
      console.log('✅ Examen encontrado para drag:', examenData.examen);
      setActiveDraggableExamen(examenData.examen);

      // Calcular el estilo para el DragOverlay
      let cellWidth = 120; // Ancho por defecto o fallback
      const firstCalendarCell = document.querySelector(
        '.calendar-table td.calendar-cell:not(.orden-col):not(.horario-col)'
      );
      if (firstCalendarCell) {
        cellWidth = firstCalendarCell.offsetWidth;
      }

      const modulosCount = examenData.examen.CANTIDAD_MODULOS_EXAMEN || 3;
      const overlayHeight = modulosCount * 40; // 40px por módulo

      setDragOverlayStyle({
        width: `${cellWidth}px`,
        height: `${overlayHeight}px`,
        transform: 'rotate(3deg)', // Rotación más sutil
        boxShadow: '0 6px 12px rgba(0,0,0,0.25)', // Sombra más sutil
        opacity: 0.9, // Un poco más opaco para mejor visibilidad
      });

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

  // Función para limpiar estados después de procesar el drop
  const handleDropProcessed = () => {
    console.log('Drop procesado correctamente, limpiando estados');
    setDraggedExamen(null);
    setDropTargetCell(null);
    setHoverTargetCell(null);
    setDragOverlayStyle({}); // Limpiar estilo del overlay
    setIsDragging(false); // ← Detener tracking
  };

  // Manejador de fin de arrastre
  const handleDragEnd = (event) => {
    setActiveDraggableExamen(null);
    setIsDragging(false);

    const { active, over } = event;

    if (!active || !over) {
      console.log('Drop cancelado: No hay active o over');
      return;
    }

    if (!isMouseInsideCalendar()) {
      console.log(
        'Drop cancelado: El cursor del mouse está fuera del área del calendario.'
      );
      return; // ¡Importante! Cancela el drop aquí.
    }

    const examDropData = active.data?.current?.examen;
    const targetData = over.data?.current;

    // Verificación más completa
    if (!examDropData) {
      console.error('Drop cancelado: No hay datos del examen');
      return;
    }

    if (!targetData) {
      console.error('Drop cancelado: No hay datos del objetivo');
      return;
    }

    if (targetData.type !== 'celda-calendario') {
      console.error(
        'Drop cancelado: El objetivo no es una celda de calendario'
      );
      return;
    }

    // Verificar que tenemos un módulo válido
    if (!targetData.modulo) {
      console.error('Drop cancelado: No hay datos del módulo');
      return;
    }

    // A partir de aquí, ya sabemos que tenemos todos los datos necesarios
    const { fecha, moduloId, salaId, modulo } = targetData;

    // Crear un objeto módulo completo si solo tenemos el ID
    const moduloCompleto = modulo || {
      ID_MODULO: moduloId,
      ORDEN: targetData.orden || 0,
    };

    // Actualizar estados
    setDraggedExamen(examDropData);
    setDropTargetCell({
      fecha,
      moduloId,
      salaId,
      modulo: moduloCompleto,
      cellId: over.id,
    });

    console.log('Drop procesado con éxito:', {
      examen: examDropData.NOMBRE_EXAMEN,
      fecha,
      modulo: moduloCompleto,
      salaId,
    });
  };

  // DRAG CANCEL
  const handleDragCancel = () => {
    setActiveDraggableExamen(null);
    setDraggedExamen(null);
    setDropTargetCell(null);
    setHoverTargetCell(null);
    setDragOverlayStyle({}); // Limpiar estilo del overlay
    setIsDragging(false); // ← Detener tracking
    console.log('🚫 Drag cancelado');
  };

  return (
    <Layout>
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
              onModulosChange={handleModulosChangeGlobal} // Pasar la nueva función
            />

            {/* Feedback solo cuando está siendo arrastrado Y dentro del calendario */}
            <DragFeedback
              draggedExamen={activeDraggableExamen}
              dropTargetCell={hoverTargetCell}
            />
          </div>

          <DragOverlay>
            {activeDraggableExamen ? (
              <ExamenPostIt
                examen={activeDraggableExamen}
                isPreview={true}
                isDragOverlay={true}
                moduloscount={
                  activeDraggableExamen.CANTIDAD_MODULOS_EXAMEN || 3
                }
                style={dragOverlayStyle} // Usar el estilo calculado
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Layout>
  );
}

export default CalendarioPage;
