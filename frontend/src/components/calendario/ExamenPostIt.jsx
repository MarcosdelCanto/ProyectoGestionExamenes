import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { FaGripLines, FaArrowsAltV } from 'react-icons/fa';

export default function ExamenPostIt({
  examen,
  setNodeRef,
  style,
  onModulosChange, // Nueva prop para manejar cambios en cantidad de módulos
  minModulos = 1, // Valor mínimo permitido de módulos
  maxModulos = 12, // Valor máximo permitido de módulos
  ...props
}) {
  const [modulosCount, setModulosCount] = useState(
    examen?.CANTIDAD_MODULOS_EXAMEN || 1
  );
  const [isResizing, setIsResizing] = useState(false);
  const startResizeRef = useRef(null);
  const startHeightRef = useRef(null);
  const moduleHeightRef = useRef(20); // Altura aproximada por módulo en px

  // Color basado en la asignatura o tipo de examen para mejor identificación visual
  const getPostItColor = () => {
    if (!examen) return '#fffacd';
    // Generar un color semi-aleatorio basado en el ID o nombre del examen
    const hash = examen.NOMBRE_ASIGNATURA?.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );

    // Colores pastel para mejor legibilidad
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

  const postItStyle = {
    backgroundColor: getPostItColor(),
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    padding: '4px',
    width: '120px',
    height: `${85 + (modulosCount - 1) * 20}px`, // Altura base + extra por módulo
    boxShadow: isResizing
      ? '0 0 8px rgba(0,0,255,0.5)'
      : '1px 1px 4px rgba(0,0,0,0.2)',
    fontSize: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
    touchAction: 'none',
    transition: isResizing ? 'none' : 'box-shadow 0.2s, transform 0.1s',
    cursor: 'grab',
    ...style,
  };

  const headerStyle = {
    fontSize: '0.7rem',
    textAlign: 'center',
    fontWeight: 'bold',
    padding: '2px',
    marginBottom: '4px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: '2px',
  };

  const contentStyle = {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '2px',
    fontSize: '0.65rem',
  };

  const detailStyle = {
    fontSize: '0.65rem',
    marginBottom: '3px',
    display: 'flex',
    justifyContent: 'space-between',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const resizerStyle = {
    cursor: 'ns-resize',
    height: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: '1px solid #ddd',
    backgroundColor: 'rgba(0,0,0,0.05)',
    fontSize: '10px',
  };

  // Manejo del inicio del redimensionamiento
  const handleResizeStart = (e) => {
    e.stopPropagation(); // Evitar que el drag comience
    e.preventDefault();
    setIsResizing(true);
    startResizeRef.current = e.clientY;
    startHeightRef.current = postItStyle.height;

    // Añadir event listeners para el movimiento y fin del redimensionamiento
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Manejo del redimensionamiento en movimiento
  const handleResizeMove = (e) => {
    if (!isResizing) return;

    const deltaY = e.clientY - startResizeRef.current;
    const newHeight = Math.max(85, parseInt(startHeightRef.current) + deltaY);

    // Calcular cuántos módulos representaría la nueva altura
    const newModulosCount = Math.max(
      minModulos,
      Math.min(
        maxModulos,
        Math.round((newHeight - 85) / moduleHeightRef.current) + 1
      )
    );

    if (newModulosCount !== modulosCount) {
      setModulosCount(newModulosCount);
      if (onModulosChange) {
        onModulosChange(examen.ID_EXAMEN, newModulosCount);
      }
    }
  };

  // Manejo del fin del redimensionamiento
  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Limpia los event listeners cuando el componente se desmonta
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  if (!examen) {
    return null;
  }

  return (
    <div ref={setNodeRef} style={postItStyle} {...props}>
      <div style={headerStyle}>
        <span className="drag-handle">
          <FaGripLines />
        </span>
        <span
          title={examen.NOMBRE_ASIGNATURA}
          style={{ flex: 1, textAlign: 'center' }}
        >
          {examen.NOMBRE_ASIGNATURA}
        </span>
      </div>
      <div style={contentStyle}>
        <div style={detailStyle} title={`Sección: ${examen.NOMBRE_SECCION}`}>
          <strong>Sección:</strong> {examen.NOMBRE_SECCION}
        </div>
        <div style={detailStyle} title={`Módulos: ${modulosCount}`}>
          <strong>Módulos:</strong> {modulosCount}
        </div>
        <div
          style={detailStyle}
          title={`Estado: ${examen.NOMBRE_ESTADO || 'N/A'}`}
        >
          <strong>Estado:</strong> {examen.NOMBRE_ESTADO || 'N/A'}
        </div>
      </div>
      <div style={resizerStyle} onMouseDown={handleResizeStart}>
        <FaArrowsAltV />
      </div>
    </div>
  );
}
