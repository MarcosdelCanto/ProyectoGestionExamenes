import React, { useState, useRef, useEffect } from 'react';
import { FaArrowsAltV } from 'react-icons/fa';
import './styles/PostIt.css';

export default function ExamenPostIt({
  examen,
  setNodeRef,
  style,
  moduloscount,
  esReservaConfirmada = false,
  onModulosChange,
  onRemove,
  onDeleteReserva,
  onCheckConflict,
  minModulos = 1,
  maxModulos = 12,
  isPreview = false,
  isDragOverlay = false, // Nueva prop
  dragHandleListeners, // Props de @dnd-kit
  isBeingDragged,
  fecha,
  moduloInicial,
  examenAsignadoCompleto,
  ...props
}) {
  const [moduloscountState, setModuloscountState] = useState(
    moduloscount ||
      examen?.MODULOS?.length ||
      examen?.CANTIDAD_MODULOS_EXAMEN ||
      3
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizeError, setResizeError] = useState(null);
  const startResizeRef = useRef(null);
  const startHeightRef = useRef(null);

  // Sincronizar con prop externa
  useEffect(() => {
    if (moduloscount !== undefined && moduloscount !== moduloscountState) {
      setModuloscountState(moduloscount);
    }
  }, [moduloscount, moduloscountState]);

  // RESIZE: Solo si NO es preview, NO es overlay y NO está siendo arrastrado
  const canResize = !isPreview && !isDragOverlay && !isBeingDragged;

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();

    const deltaY = e.clientY - startResizeRef.current;
    const newHeight = Math.max(40, startHeightRef.current + deltaY);
    const newModulosCount = Math.max(
      minModulos,
      Math.min(maxModulos, Math.round(newHeight / 40))
    );

    if (newModulosCount !== moduloscountState) {
      // Verificar conflictos
      if (
        onCheckConflict &&
        typeof onCheckConflict === 'function' &&
        fecha &&
        moduloInicial
      ) {
        try {
          const hasConflict = onCheckConflict(
            examen.ID_EXAMEN,
            fecha,
            moduloInicial,
            newModulosCount
          );

          if (hasConflict) {
            setResizeError('Conflicto detectado');
            return;
          } else {
            setResizeError(null);
          }
        } catch (error) {
          console.error('Error verificando conflictos:', error);
          setResizeError('Error al verificar disponibilidad');
          return;
        }
      }

      setModuloscountState(newModulosCount);
      if (onModulosChange) {
        onModulosChange(examen.ID_EXAMEN, newModulosCount);
      }
    }
  };

  const handleResizeStart = (e) => {
    if (!canResize) return;

    // IMPORTANTE: Parar completamente la propagación
    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation(); // ← AGREGAR ESTO

    console.log('🎯 Resize start event captured'); // Debug

    setIsResizing(true);
    startResizeRef.current = e.clientY;
    startHeightRef.current = e.currentTarget.parentElement.offsetHeight;

    // Deshabilitar drag temporalmente
    document.body.style.pointerEvents = 'none';
    e.currentTarget.style.pointerEvents = 'auto';

    document.addEventListener('mousemove', handleResizeMove, {
      passive: false,
    });
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeEnd = () => {
    console.log('🏁 Resize end'); // Debug
    setIsResizing(false);
    setResizeError(null);

    // Restaurar pointer events
    document.body.style.pointerEvents = '';

    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleDelete = (e) => {
    e.stopPropagation();

    if (esReservaConfirmada && onDeleteReserva && examenAsignadoCompleto) {
      onDeleteReserva(examenAsignadoCompleto);
    } else if (!esReservaConfirmada && onRemove) {
      onRemove(examen.ID_EXAMEN);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);

  // Color
  const getPostItColor = () => {
    if (!examen) return '#fffacd';
    const hash = examen.NOMBRE_ASIGNATURA?.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    const colors = [
      '#ffcccc',
      '#ffddaa',
      '#ffffcc',
      '#ccffcc',
      '#ccffff',
      '#ccccff',
      '#ffccff',
    ];
    return colors[hash % colors.length] || '#fffacd';
  };

  // Estilos
  const getStyles = () => ({
    backgroundColor: getPostItColor(),
    height: isPreview
      ? `${60 + (moduloscountState - 1) * 20}px`
      : `${40 * moduloscountState}px`,
    width: isPreview ? '120px' : '100%',
    zIndex: isResizing ? 100 : isPreview ? 1 : 50,
    ...style,
  });

  // Clases
  const getMainClass = () => {
    const classes = [
      'examen-post-it',
      isPreview ? 'is-preview' : 'is-placed',
      isBeingDragged ? 'is-dragging' : '',
      isResizing ? 'is-resizing' : '',
      resizeError ? 'has-error' : '',
      esReservaConfirmada ? 'is-confirmed' : 'is-pending',
      isDragOverlay ? 'is-drag-overlay' : '',
    ];

    return classes.filter(Boolean).join(' ');
  };

  if (!examen) return null;

  return (
    <div
      ref={setNodeRef}
      style={getStyles()}
      className={getMainClass()}
      data-modulos={moduloscountState}
      data-fecha={fecha}
      data-modulo-inicial={moduloInicial}
      // IMPORTANTE: Solo pasar dragHandleListeners si NO es DragOverlay
      {...(!isDragOverlay ? dragHandleListeners : {})}
      {...props}
    >
      <div className="examen-content">
        <div className="examen-header">
          <span className="examen-title">{examen.NOMBRE_ASIGNATURA}</span>
          {!isPreview && !isDragOverlay && (
            <button
              className="btn-remove"
              onClick={handleDelete}
              aria-label="Eliminar examen"
              title={esReservaConfirmada ? 'Eliminar reserva' : 'Quitar examen'}
            >
              ✕
            </button>
          )}
        </div>

        <div className="content">
          <div className="detail">
            <span className="detail-label">Sección:</span>
            <span title={examen.NOMBRE_SECCION}>
              {examen.NOMBRE_SECCION || 'N/A'}
            </span>
          </div>
          <div className="detail">
            <span className="detail-label">Módulos:</span>
            <span>{moduloscountState}</span>
          </div>
        </div>

        {resizeError && (
          <div className="resize-error-message">{resizeError}</div>
        )}
      </div>

      {/* RESIZE HANDLE: FUERA del examen-content para evitar conflictos */}
      {canResize && (
        <div
          style={{
            cursor: 'ns-resize',
            height: '12px', // ← Aumentar altura para mejor click
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #ddd',
            backgroundColor: isResizing ? '#007bff' : 'rgba(0,0,0,0.1)',
            fontSize: '10px',
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            zIndex: 999, // ← Z-index alto
            pointerEvents: 'auto', // ← Forzar pointer events
            userSelect: 'none',
            transition: isResizing ? 'none' : 'background-color 0.2s ease',
          }}
          onMouseDown={handleResizeStart}
          className="resize-handle"
          title="Arrastra para redimensionar"
          // ← AGREGAR eventos adicionales para debugging
          onMouseEnter={() => console.log('🎯 Mouse enter resize handle')}
          onMouseLeave={() => console.log('🎯 Mouse leave resize handle')}
          onClick={(e) => {
            e.stopPropagation();
            console.log('🎯 Resize handle clicked');
          }}
        >
          <FaArrowsAltV style={{ pointerEvents: 'none' }} />
          {isResizing && (
            <span style={{ marginLeft: '5px', pointerEvents: 'none' }}>
              REDIMENSIONANDO
            </span>
          )}
        </div>
      )}
    </div>
  );
}
