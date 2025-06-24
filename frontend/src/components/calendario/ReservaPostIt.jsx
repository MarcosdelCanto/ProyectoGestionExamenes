import React from 'react';
import './styles/PostIt.css'; // Reutilizar los mismos estilos

/**
 * Un componente de "post-it" simplificado y de solo lectura,
 * diseñado específicamente para visualizar una reserva confirmada.
 */
export default function ReservaPostIt({ reserva, style }) {
  if (!reserva) return null;

  // Función para determinar el color del post-it y su borde basado en el nombre de la asignatura
  const getPostItColor = () => {
    if (!reserva.NOMBRE_ASIGNATURA) return { bg: '#f8f9fa', border: '#6c757d' }; // Color gris por defecto
    const hash = reserva.NOMBRE_ASIGNATURA.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    // Paleta de colores pastel más suaves y consistentes
    const colors = [
      { bg: '#e9f7ef', border: '#a3d9b8' }, // Menta
      { bg: '#fff4e5', border: '#ffdcb2' }, // Durazno
      { bg: '#eef2ff', border: '#c8d3ff' }, // Lavanda
      { bg: '#fce8e6', border: '#f7b9b3' }, // Rosa
      { bg: '#e6f4ea', border: '#a0d7b1' }, // Verde mar
      { bg: '#fef7e0', border: '#fde79c' }, // Amarillo
    ];
    return colors[hash % colors.length] || { bg: '#f8f9fa', border: '#6c757d' };
  };

  const modulosCount = reserva.MODULOS_IDS
    ? reserva.MODULOS_IDS.split(',').length
    : 1;

  const { bg, border } = getPostItColor();

  const postItStyle = {
    backgroundColor: bg,
    height: `${40 * modulosCount}px`,
    borderLeft: `4px solid ${border}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...style,
  };

  return (
    <div
      style={postItStyle}
      className="examen-post-it readonly-post-it shadow-sm"
    >
      <div className="examen-content" style={{ padding: '4px 8px' }}>
        <div className="examen-header">
          <div className="examen-info">
            <div className="examen-title fw-bold">
              <i className="bi bi-book me-2"></i>
              {reserva.NOMBRE_ASIGNATURA ||
                reserva.NOMBRE_EXAMEN ||
                'Sin nombre'}
            </div>
            <div className="examen-details text-muted small mt-1 fw-bold">
              {reserva.NOMBRE_CARRERA && (
                <div className="d-flex align-items-center">
                  <i className="bi bi-mortarboard me-1"></i>
                  <span>{reserva.NOMBRE_CARRERA}</span>
                </div>
              )}
              {reserva.NOMBRE_SECCION && (
                <div className="d-flex align-items-center">
                  <i className="bi bi-diagram-3 me-1"></i>
                  <span>{reserva.NOMBRE_SECCION}</span>
                </div>
              )}
              {reserva.NOMBRE_DOCENTE && (
                <div className="d-flex align-items-center">
                  <i className="bi bi-person me-1"></i>
                  <span>{reserva.NOMBRE_DOCENTE}</span>
                </div>
              )}
              {reserva.NOMBRE_SALA && (
                <div className="d-flex align-items-center">
                  <i className="bi bi-door-open me-1"></i>
                  <span>{reserva.NOMBRE_SALA}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
