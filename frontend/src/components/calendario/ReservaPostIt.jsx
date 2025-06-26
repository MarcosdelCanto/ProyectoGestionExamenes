// src/components/calendario/ReservaPostIt.jsx

import React from 'react';
import './styles/PostIt.css';

// --- ELIMINADO: Mapa de Colores por Escuela ---
// Ya no es necesario, los colores se obtienen directamente de los datos de la reserva
// const ESCUELA_COLOR_MAP = { ... };

export default function ReservaPostIt({ reserva, modulosCount = 1, style }) {
  // console.log('Datos de la reserva recibidos en ReservaPostIt:', reserva); // Puedes descomentar esto para depurar si es necesario

  if (!reserva) return null;

  const getPostItColor = () => {
    // Definimos un color por defecto en caso de que la reserva no traiga colores
    const defaultColor = { bg: '#e9ecef', border: '#adb5bd' }; // Gris por defecto

    // Si el objeto 'reserva' ya contiene las propiedades de color de fondo y borde, las usamos directamente.
    // Esto es posible porque el hook 'useAgendaData' se encarga de enriquecer el objeto 'reserva' con estos colores,
    // que a su vez son obtenidos de la base de datos a través del controlador.
    if (reserva.COLOR_BACKGROUND && reserva.COLOR_BORDER) {
      return { bg: reserva.COLOR_BACKGROUND, border: reserva.COLOR_BORDER };
    }

    // Si por alguna razón (por ejemplo, datos antiguos o un error en la obtención/enriquecimiento de datos),
    // los colores no están presentes en la reserva, se utiliza el color por defecto.
    return defaultColor;
  };

  // El conteo de módulos es más fiable si viene del array de módulos de la reserva.
  const finalModulosCount = reserva.MODULOS?.length || modulosCount || 1;

  // Obtenemos los colores a aplicar para este post-it
  const { bg, border } = getPostItColor();

  // Definimos los estilos dinámicos del post-it
  const postItStyle = {
    backgroundColor: bg,
    height: `${40 * finalModulosCount}px`, // 40px por módulo es el tamaño estándar
    borderLeft: `4px solid ${border}`, // Borde izquierdo con el color asignado
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...style, // Permite sobrescribir estilos desde el componente padre
  };

  return (
    <div
      style={postItStyle}
      className="examen-post-it readonly-post-it shadow-sm" // Clases CSS para el estilo base y sombra
    >
      <div className="examen-content" style={{ padding: '4px 8px' }}>
        <div className="examen-header">
          <div className="examen-info">
            {/* Título principal del post-it: nombre de asignatura o examen */}
            <div className="examen-title fw-bold">
              <i className="bi bi-book me-2"></i> {/* Icono de libro */}
              {reserva.NOMBRE_ASIGNATURA ||
                reserva.NOMBRE_EXAMEN ||
                'Sin nombre'}
            </div>

            {/* Detalles adicionales de la reserva */}
            {reserva.NOMBRE_SECCION && (
              <div className="d-flex align-items-center">
                <i className="bi bi-diagram-3 me-1"></i>{' '}
                {/* Icono de sección */}
                <span>{reserva.NOMBRE_SECCION}</span>
              </div>
            )}
            {reserva.NOMBRE_DOCENTE && (
              <div className="d-flex align-items-center">
                <i className="bi bi-person me-1"></i>{' '}
                {/* Icono de persona/docente */}
                <span>{reserva.NOMBRE_DOCENTE}</span>
              </div>
            )}
            {reserva.NOMBRE_SALA && (
              <div className="d-flex align-items-center">
                <i className="bi bi-door-open me-1"></i> {/* Icono de sala */}
                <span>{reserva.NOMBRE_SALA}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
