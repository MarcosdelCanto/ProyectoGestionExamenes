import React, { useState, useRef, useEffect } from 'react';
import { FaGripLines, FaArrowsAltV } from 'react-icons/fa';

export default function ExamenPostIt({
  examen,
  setNodeRef, // Referencia para DndKit
  style, // Estilos aplicados por DndKit
  onModulosChange,
  minModulos = 1,
  maxModulos = 12,
  isPreview = false, // Nuevo prop para diferenciar vista previa vs colocado
  dragHandleListeners, // Listeners para el drag handle
  isBeingDragged, // Para saber si el elemento está siendo arrastrado por dnd-kit
  ...props
}) {
  const [modulosCount, setModulosCount] = useState(
    examen?.CANTIDAD_MODULOS_EXAMEN || 1
  );
  const [isResizing, setIsResizing] = useState(false);
  const startResizeRef = useRef(null);
  const startHeightRef = useRef(null);
  const moduleHeightRef = useRef(20);

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

  // Manejadores para el redimensionamiento - solo si NO es vista previa
  const handleResizeStart = (e) => {
    if (isPreview) return; // No permitir redimensionamiento en vista previa

    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startResizeRef.current = e.clientY;
    startHeightRef.current = e.currentTarget.parentElement.offsetHeight;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;

    const deltaY = e.clientY - startResizeRef.current;
    const baseHeight = startHeightRef.current || 40;
    const newHeight = Math.max(40, baseHeight + deltaY);

    // Calcular nuevos módulos basados en la altura
    const newModulosCount = Math.max(
      minModulos,
      Math.min(
        maxModulos,
        Math.round(newHeight / (moduleHeightRef.current * 2))
      )
    );

    if (newModulosCount !== modulosCount) {
      setModulosCount(newModulosCount);
      if (onModulosChange) {
        onModulosChange(examen.ID_EXAMEN, newModulosCount);
      }
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
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
    userSelect: 'none', // Prevenir selección de texto durante drag
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
      }`}
      {...props}
    >
      <div
        style={{
          fontSize: isPreview ? '0.7rem' : '0.8rem',
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
        }}
      >
        {/* Div wrapper para detener la propagación de eventos a Swiper */}
        <div
          className={`drag-handle-activator ${
            // Renombrar clase para claridad
            isPreview && dragHandleListeners ? 'swiper-no-swiping' : ''
          }`}
          style={{
            cursor: isPreview && dragHandleListeners ? 'grab' : 'default',
            padding: '0 4px',
            display: 'inline-flex', // Para centrar el ícono
            alignItems: 'center',
            touchAction: 'none', // Fundamental para interacciones táctiles con dnd-kit
            position: 'relative', // Ayuda a que z-index funcione en su contexto de apilamiento
            zIndex: 10, // Un valor para asegurar que esté "encima" de elementos hermanos dentro del mismo contexto de apilamiento
            pointerEvents: 'auto', // Asegurar explícitamente que este elemento reciba eventos de puntero
          }}
          onMouseDown={() => console.log('Mouse Down on Handle Activator')} // <-- AÑADIR ESTO
          onTouchStart={() => console.log('Touch Start on Handle Activator')} // <-- Y ESTO
          // Aplicar listeners de dnd-kit aquí, solo en modo preview
          {...(isPreview && dragHandleListeners ? dragHandleListeners : {})}
        >
          <FaGripLines />
        </div>
        <span
          title={examen.NOMBRE_ASIGNATURA}
          style={{
            flex: 1,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {examen.NOMBRE_ASIGNATURA}
        </span>
      </div>

      <div
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '2px',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            marginBottom: '3px',
            display: 'flex',
            justifyContent: 'space-between',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={`Sección: ${examen.NOMBRE_SECCION}`}
        >
          <strong>Sección:</strong> {examen.NOMBRE_SECCION || 'N/A'}
        </div>

        <div
          style={{
            fontSize: '0.7rem',
            marginBottom: '3px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
          title={`Módulos: ${modulosCount}`}
        >
          <strong>Módulos:</strong> {modulosCount}
        </div>
      </div>

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
        >
          <FaArrowsAltV />
        </div>
      )}
    </div>
  );
}
