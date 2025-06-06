import React, { useState, useRef, useEffect } from 'react';
import { FaArrowsAltV } from 'react-icons/fa';
import './styles/PostIt.css';

export default function ExamenPostIt({
  examen,
  setNodeRef,
  style,
  moduloscount,
  esReservaConfirmada = false, // ← NUEVA PROP
  onModulosChange,
  onRemove,
  onDeleteReserva, // ← NUEVA PROP
  onCheckConflict,
  minModulos = 1,
  maxModulos = 12,
  isPreview = false,
  dragHandleListeners,
  isBeingDragged,
  fecha,
  moduloInicial,
  examenAsignadoCompleto, // ← NUEVA PROP
  ...props
}) {
  const [moduloscountState, setModuloscountState] = useState(
    // NUEVA PRIORIDAD - usar módulos de la RESERVA:
    moduloscount || // 1. Prop explícita
      examen?.MODULOS?.length || // 2. Módulos de reserva (array MODULOS)
      examen?.MODULOS_IDS_ARRAY?.length || // 3. Módulos de reserva (array IDs)
      examen?.CANTIDAD_MODULOS_RESERVA || // 4. Campo calculado de reserva
      examen?.CANTIDAD_MODULOS_EXAMEN || // 5. Módulos del examen (fallback)
      3 // 6. Default
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

    if (newModulosCount !== moduloscountState) {
      // Primero verificar si la función existe antes de usarla
      if (
        onCheckConflict &&
        typeof onCheckConflict === 'function' &&
        fecha &&
        moduloInicial
      ) {
        try {
          // Agregamos un console.log para depuración
          console.log(
            `Verificando redimensionamiento: ID=${examen.ID_EXAMEN}, fecha=${fecha}, módulo=${moduloInicial}, nuevos=${newModulosCount}`
          );

          const hasConflict = onCheckConflict(
            examen.ID_EXAMEN,
            fecha,
            moduloInicial,
            newModulosCount
          );

          if (hasConflict) {
            console.log('Se detectó un conflicto');
            setResizeError(
              'No se puede redimensionar: conflicto con otro examen o fuera del rango de módulos'
            );
            return;
          } else {
            console.log('No hay conflicto, permitiendo redimensionamiento');
            setResizeError(null);
          }
        } catch (error) {
          console.error('Error al verificar conflictos:', error);
          setResizeError('Error al verificar disponibilidad');
          return;
        }
      }

      // Si no hay conflicto o no se puede verificar, permitir el cambio
      setModuloscountState(newModulosCount);
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

  // AGREGAR: Función para manejar la eliminación
  const handleDelete = (e) => {
    e.stopPropagation();

    console.log('=== DEBUG ExamenPostIt handleDelete ===');
    console.log('esReservaConfirmada:', esReservaConfirmada);
    console.log('onDeleteReserva:', typeof onDeleteReserva);
    console.log('onRemove:', typeof onRemove);
    console.log('examenAsignadoCompleto:', examenAsignadoCompleto);

    if (esReservaConfirmada && onDeleteReserva && examenAsignadoCompleto) {
      console.log('Llamando a onDeleteReserva...');
      onDeleteReserva(examenAsignadoCompleto);
    } else if (!esReservaConfirmada && onRemove) {
      console.log('Llamando a onRemove...');
      onRemove(examen.ID_EXAMEN);
    } else {
      console.log('ERROR: No se puede eliminar - faltan props o configuración');
    }
  };

  // Limpieza de event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // SIMPLIFICAR: Un solo objeto de estilos
  const getStyles = () => {
    const baseStyles = {
      backgroundColor: getPostItColor(),
      // Solo los estilos que realmente necesitan ser dinámicos
      height: isPreview
        ? `${60 + (moduloscountState - 1) * 20}px`
        : `${40 * moduloscountState}px`,
      width: isPreview ? '120px' : '100%',
      zIndex: isResizing ? 100 : isPreview ? 1 : 50,
      // Combinar con estilos externos
      ...style,
    };

    return baseStyles;
  };

  // USAR en el JSX:
  const finalStyles = getStyles();

  // NUEVA FUNCIÓN: Determinar la clase principal
  const getMainClass = () => {
    let classes = [];

    // Estado principal
    if (isPreview) classes.push('is-preview');
    else classes.push('is-placed');

    // Estados temporales
    if (isBeingDragged) classes.push('is-dragging');
    if (isResizing) classes.push('is-resizing');
    if (resizeError) classes.push('has-error');

    // Tipo de examen
    if (esReservaConfirmada) classes.push('is-confirmed');
    else classes.push('is-pending');

    return classes.join(' ');
  };

  if (!examen) return null;

  return (
    <div
      ref={setNodeRef}
      style={finalStyles}
      className={`examen-post-it ${getMainClass()}`} // ← UNA SOLA FUNCIÓN
      data-modulos={moduloscountState}
      data-fecha={fecha}
      data-modulo-inicial={moduloInicial}
      {...props}
    >
      <div className="examen-content">
        <div className="examen-header">
          <span className="examen-title">{examen.NOMBRE_ASIGNATURA}</span>
          {!isPreview && (
            <button
              className="btn-remove"
              onClick={handleDelete} // ← CAMBIAR AQUÍ
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
          {examen.CANT_ALUMNOS && (
            <div className="detail">
              <span className="detail-label">Alumnos:</span>
              <span>{examen.CANT_ALUMNOS}</span>
            </div>
          )}
          <div className="detail">
            <span className="detail-label">Módulos:</span>
            <span>{moduloscountState}</span>
          </div>

          {isPreview && (
            <div className="modulos-indicator">
              {moduloscountState}{' '}
              {moduloscountState === 1 ? 'módulo' : 'módulos'}
            </div>
          )}
        </div>

        {/* Mensaje de error de redimensionamiento */}
        {resizeError && (
          <div className="resize-error-message">{resizeError}</div>
        )}

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
              zIndex: 1,
            }}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="resize-handle"
          >
            <FaArrowsAltV />
          </div>
        )}
      </div>
    </div>
  );
}
