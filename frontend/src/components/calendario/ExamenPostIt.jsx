import React from 'react';

export default function ExamenPostIt({ examen, setNodeRef, style, ...props }) {
  const postItStyle = {
    backgroundColor: '#fffacd',
    border: '1px solid #f0e68c',
    borderRadius: '4px',
    padding: '2px', // Reducir padding
    // margin: '5px', // Swiper maneja el espaciado con `spaceBetween`
    width: '120px', // Reducir ancho
    height: '85px', // Reducir alto
    boxShadow: '1px 1px 2px rgba(0,0,0,0.1)', // Sombra más sutil
    fontSize: '0.5rem', // Reducir tamaño de fuente base
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden', // Para evitar que el contenido se desborde y cause scroll interno no deseado
    boxSizing: 'border-box',
    touchAction: 'none',
    ...style,
  };

  const headerStyle = {
    fontSize: '0.6rem', // Ajustar
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginBottom: '2px', // Reducir
    borderBottom: '1px solid #eee',
    paddingBottom: '2px', // Reducir
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap', // Evitar que el título se parta en muchas líneas
    overflow: 'hidden', // Ocultar si el título es muy largo
    textOverflow: 'ellipsis', // Añadir puntos suspensivos
    flexShrink: 0,
  };

  const contentStyle = {
    flexGrow: 1,
    overflowY: 'auto', // Permitir scroll si el contenido interno es mucho
    paddingRight: '3px', // Pequeño padding para el scrollbar si aparece
    fontSize: '0.65rem', // Ajustar
  };

  const detailStyle = {
    fontSize: '0.65rem', // Ya controlado por contentStyle o puede ser específico
    marginBottom: '1px', // Reducir
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    wordBreak: 'break-word',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  if (!examen) {
    return null;
  }

  return (
    <div ref={setNodeRef} style={postItStyle} {...props}>
      <div style={headerStyle} title={examen.NOMBRE_ASIGNATURA}>
        {' '}
        {/* Añadir title para ver completo al hacer hover */}
        {examen.NOMBRE_ASIGNATURA}
      </div>
      <div style={contentStyle}>
        <div style={detailStyle} title={`Sección: ${examen.NOMBRE_SECCION}`}>
          <strong></strong> {examen.NOMBRE_SECCION}
        </div>
        <div
          style={detailStyle}
          title={`Módulos: ${examen.CANTIDAD_MODULOS_EXAMEN}`}
        >
          <strong>Módulos:</strong> {examen.CANTIDAD_MODULOS_EXAMEN}
        </div>
        {/* Puedes añadir más detalles si caben o si el scroll es aceptable */}
      </div>
    </div>
  );
}
