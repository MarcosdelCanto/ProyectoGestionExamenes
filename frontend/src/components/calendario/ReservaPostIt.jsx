// src/components/calendario/ReservaPostIt.jsx

import React from 'react';
import './styles/PostIt.css';

// --- INICIO: Mapa de Colores por Escuela ---
// Se han usado los nombres exactos que proporcionaste desde tu base de datos.
const ESCUELA_COLOR_MAP = {
  // Escuelas Principales con colores vivos
  'Administración y Negocios': { bg: '#f5d6fd', border: '#ac4fc6' },
  'Ingeniería, Medio Ambiente y Recursos Naturales': {
    bg: '#e1f7de',
    border: '#3aad2a',
  },
  'Informática y Telecomunicaciones': { bg: '#d1e5fe', border: '#307fe2' },
  'Salud y Bienestar': { bg: '#dcf3fb', border: '#5bc2e7' },
  'Turismo y Hospitalidad': { bg: '#dcf6f5', border: '#00a499' },
  Construccion: { bg: '#ffe4cf', border: '#e87722' },
  Gastronoía: { bg: '#fee5e6', border: '#ff585d' },

  // Programas Transversales con colores distintivos
  'Programa de Formación Cristiana': { bg: '#fdebe1', border: '#f7bca0' }, // Salmón
  'Programa de Lenguaje y Comunicación': { bg: '#fef7e0', border: '#fde79c' }, // Amarillo Maíz
  'Programa de Matemáticas': { bg: '#f1f8e9', border: '#c5e1a5' }, // Verde Lima
  'Programa de Inglés': { bg: '#e3f2fd', border: '#90caf9' }, // Azul Cielo
  'Programa de Etica': { bg: '#ede7f6', border: '#b39ddb' }, // Lavanda
  'Programa de Emprendimiento': { bg: '#e0f2f1', border: '#80cbc4' }, // Turquesa

  // Deportes y casos especiales
  'Programa de Deportes': { bg: '#ffecb3', border: '#ffca28' }, // Ámbar
  'Extracurricular Deportes Ancla': { bg: '#ffecb3', border: '#ffca28' }, // Mismo color que Deportes
  'Docente Asistente SD - C. de Informática': {
    bg: '#eef2ff',
    border: '#c8d3ff',
  }, // Mismo que Informática
};
// --- FIN: Mapa de Colores por Escuela ---

export default function ReservaPostIt({ reserva, modulosCount = 1, style }) {
  console.log('Datos de la reserva recibidos en ReservaPostIt:', reserva);

  if (!reserva) return null;

  const getPostItColor = () => {
    const defaultColor = { bg: '#e9ecef', border: '#adb5bd' }; // Gris por defecto

    if (!reserva.NOMBRE_ESCUELA) {
      return defaultColor;
    }

    // Busca el nombre de la escuela en tu mapa. Si no lo encuentra, usa el color por defecto.
    return ESCUELA_COLOR_MAP[reserva.NOMBRE_ESCUELA] || defaultColor;
  };

  // El conteo de módulos es más fiable si viene del array de módulos de la reserva.
  const finalModulosCount = reserva.MODULOS?.length || modulosCount || 1;

  const { bg, border } = getPostItColor();

  const postItStyle = {
    backgroundColor: bg,
    height: `${40 * finalModulosCount}px`,
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
            {/*
            <div className="examen-details text-muted small mt-1 fw-bold">
              {reserva.NOMBRE_ESCUELA && (
                <div className="d-flex align-items-center fw-semibold">
                  <i className="bi bi-building me-1"></i>
                  <span>{reserva.NOMBRE_ESCUELA}</span>
                </div>
              )}
              {reserva.NOMBRE_CARRERA && (
                <div className="d-flex align-items-center">
                  <i className="bi bi-mortarboard me-1"></i>
                  <span>{reserva.NOMBRE_CARRERA}</span>
                </div>
              )} */}
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
  );
}
