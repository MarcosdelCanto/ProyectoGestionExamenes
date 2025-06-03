import React, { useState, useRef, useEffect } from 'react';
import { FaArrowsAltV } from 'react-icons/fa';
import './styles/PostIt.css';

export default function CalendarExamenView({
  examen,
  modulosCount,
  onModulosChange,
  onRemove,
  minModulos = 1,
  maxModulos = 12,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const startResizeRef = useRef(null);
  const startHeightRef = useRef(null);
  const moduleHeightRef = useRef(30); // Altura aproximada por módulo en px

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

  // Estilos para el post-it en calendario
  const containerStyle = {
    backgroundColor: getPostItColor(),
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    padding: '5px',
    boxShadow: isResizing
      ? '0 0 8px rgba(0,0,255,0.5)'
      : '1px 1px 4px rgba(0,0,0,0.2)',
    fontSize: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    position: 'relative',
    minHeight: '100%',
  };

  // Manejadores para el redimensionamiento
  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startResizeRef.current = e.clientY;

    // Encontrar la altura de la celda TD padre
    const cellElement = e.currentTarget.closest('td');
    startHeightRef.current = cellElement ? cellElement.offsetHeight : 40;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;

    const deltaY = e.clientY - startResizeRef.current;
    // Calcular nuevos módulos basados en el delta Y
    const newModulosCount = Math.max(
      minModulos,
      Math.min(
        maxModulos,
        modulosCount + Math.round(deltaY / moduleHeightRef.current)
      )
    );

    if (newModulosCount !== modulosCount && onModulosChange) {
      onModulosChange(examen.ID_EXAMEN, newModulosCount);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Manejador para eliminar el examen
  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) onRemove(examen.ID_EXAMEN);
  };

  return (
    <div
      className={`calendar-examen-view ${isResizing ? 'resizing' : ''}`}
      style={{ backgroundColor: getPostItColor() }}
    >
      <div className="calendar-examen-view__header">
        {examen.NOMBRE_ASIGNATURA}
        <button
          onClick={handleRemove}
          className="calendar-examen-view__remove-btn"
        >
          ×
        </button>
      </div>
      <div className="calendar-examen-view__details">
        <div>Sección: {examen.NOMBRE_SECCION || 'N/A'}</div>
        <div>Módulos: {modulosCount}</div>
      </div>
      <div
        className="calendar-examen-view__resize-handle"
        onMouseDown={handleResizeStart}
      >
        <FaArrowsAltV size={8} />
      </div>
    </div>
  );
}
