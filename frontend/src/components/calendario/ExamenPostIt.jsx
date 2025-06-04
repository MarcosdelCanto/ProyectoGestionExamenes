import React, { useState, useRef, useEffect } from 'react';
import { FaGripLines, FaArrowsAltV, FaTimes } from 'react-icons/fa';
import './styles/PostIt.css';
import { is } from 'date-fns/locale';
import { set } from 'date-fns';

export default function ExamenPostIt({
  examen,
  setNodeRef,
  style,
  onModulosChange,
  onRemove,
  onCheckConflict, // Añadir esta prop explícitamente
  minModulos = 1,
  maxModulos = 12,
  isPreview = false,
  dragHandleListeners,
  isBeingDragged,
  fecha,
  moduloInicial,
  ...props
}) {
  const [modulosCount, setModulosCount] = useState(
    examen?.CANTIDAD_MODULOS_EXAMEN || 1
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizeError, setResizeError] = useState(null);
  const startResizeRef = useRef(null);
  const startHeightRef = useRef(null);
  const moduleHeightRef = useRef(40);
  const lastResizeUpdateRef = useRef(0);

  // Color basado en la asignatura
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
      '#ffdddd',
    ];
    return colors[hash % colors.length] || '#fffacd';
  };

  // Modificar la función handleResizeMove para manejar mejor los errores
  const handleResizeMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();

    // Limitar la frecuencia de actualizaciones para mejorar el rendimiento
    const now = Date.now();
    if (now - lastResizeUpdateRef.current < 30) return; // Limitar a 30ms
    lastResizeUpdateRef.current = now;

    const deltaY = e.clientY - startResizeRef.current;
    const baseHeight = startHeightRef.current || 40;
    const newHeight = Math.max(40, baseHeight + deltaY);

    const newModulosCount = Math.max(
      minModulos,
      Math.min(maxModulos, Math.round(newHeight / moduleHeightRef.current))
    );

    if (newModulosCount !== modulosCount) {
      // Primero verificar si la función existe antes de usarla
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
            setResizeError('¡Conflicto! Hay otro examen en esa posición');
            return;
          } else {
            setResizeError(null);
          }
        } catch (error) {
          console.error('Error al verificar conflictos:', error);
          // No permitir cambios si hay error en la verificación
          return;
        }
      }

      // Si no hay conflicto o no se puede verificar, permitir el cambio
      setModulosCount(newModulosCount);
      if (onModulosChange) {
        onModulosChange(examen.ID_EXAMEN, newModulosCount);
      }
    }
  };
  // Manejadores para el redimensionamiento - solo si NO es vista previa
  const handleResizeStart = (e) => {
    if (isPreview) return; // No permitir redimensionamiento en vista previa
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startResizeRef.current = e.clientY;
    startHeightRef.current = e.currentTarget.parentElement.offsetHeight;
    document.addEventListener('mousemove', handleResizeMove, {
      passive: false,
    });
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeError(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleRemove = (e) => {
    e.stopPropagation(); // Evitar que el evento se propague al contenedor
    if (onRemove) {
      onRemove(examen.ID_EXAMEN);
    }
  };

  // Limpieza de event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Base styles para ambas vistas (preview y colocado)
  const baseStyles = {
    backgroundColor: getPostItColor(),
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxShadow: isResizing
      ? '0 0 8px rgba(0,0,255,0.5)'
      : '1px 1px 4px rgba(0,0,0,0.2)',
    fontSize: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
    position: 'relative',
    userSelect: 'none',
    transition: isResizing ? 'none' : 'height 0.1s ease-out',
    ...style,
  };

  // Estilos específicos para vista previa vs colocado
  const previewStyles = {
    ...baseStyles,
    padding: '4px',
    width: '120px',
    height: `${60 + (modulosCount - 1) * 20}px`,
    cursor: 'grab',
  };

  const placedStyles = {
    ...baseStyles,
    padding: '4px',
    width: '100%',
    height: '100%',
    minHeight: `${40 * modulosCount}px`, // Altura basada en cantidad de módulos
  };

  // Usar estilos diferentes basados en si es vista previa o no
  const finalStyles = isPreview ? previewStyles : placedStyles;

  if (!examen) return null;

  return (
    <div
      ref={setNodeRef}
      style={finalStyles}
      className={`examen-post-it ${isPreview ? 'preview' : 'placed'} ${
        isBeingDragged ? 'dragging' : ''
      } ${isResizing ? 'resizing' : ''} ${resizeError ? 'error-resize' : ''}`}
      data-modulos={modulosCount}
      data-fecha={fecha}
      data-modulo-inicial={moduloInicial}
      {...props}
    >
      <div className="header">
        {isPreview && dragHandleListeners && (
          <div
            className="drag-handle-activator"
            {...dragHandleListeners}
            style={{
              float: 'left',
              marginRight: '8px',
              cursor: 'grab',
              paddingTop: '2px',
            }}
          >
            <FaGripLines />
          </div>
        )}
        <span title={examen.NOMBRE_ASIGNATURA}>{examen.NOMBRE_ASIGNATURA}</span>
        {/* Botón de eliminar - solo visible cuando no es preview */}
        {!isPreview && (
          <button
            onClick={handleRemove}
            style={{
              background: 'none',
              border: 'none',
              color: '#f00',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0',
              marginLeft: '8px',
              float: 'right',
            }}
            title="Eliminar examen"
          >
            <FaTimes />
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
        {examen.CANT_ALUMNOS && (
          <div className="detail">
            <span className="detail-label">Alumnos:</span>
            <span>{examen.CANT_ALUMNOS}</span>
          </div>
        )}
        <div className="detail">
          <span className="detail-label">Módulos:</span>
          <span>{modulosCount}</span>
        </div>

        {isPreview && (
          <div className="modulos-indicator">
            {modulosCount} {modulosCount === 1 ? 'módulo' : 'módulos'}
          </div>
        )}
      </div>

      {/* Mensaje de error de redimensionamiento */}
      {resizeError && <div className="resize-error-message">{resizeError}</div>}

      {!isPreview && (
        <div
          style={{
            cursor: 'ns-resize',
            height: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #ddd',
            backgroundColor: 'rgba(0,0,0,0.05)',
            fontSize: '10px',
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
          }}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="resize-handle"
        >
          <FaArrowsAltV />
        </div>
      )}
    </div>
  );
}
