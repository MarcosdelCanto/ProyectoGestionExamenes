import React from 'react';

// Añade las props setNodeRef, listeners y attributes
export default function ExamenPostIt({ examen, setNodeRef, style, ...props }) {
  const postItStyle = {
    backgroundColor: '#fffacd',
    border: '1px solid #f0e68c',
    borderRadius: '4px',
    padding: '8px',
    margin: '5px', // Swiper puede manejar el espaciado con `spaceBetween`
    width: '150px', // Ajusta el ancho según necesites para Swiper
    height: '120px',
    boxShadow: '1px 1px 3px rgba(0,0,0,0.1)',
    // cursor: 'grab', // dnd-kit puede manejar esto con los listeners
    fontSize: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflowY: 'auto',
    boxSizing: 'border-box',
    touchAction: 'none', // Puede ayudar a prevenir conflictos de scroll/swipe con dnd-kit
    ...style, // Permite pasar estilos adicionales desde dnd-kit (ej. transform)
  };

  const headerStyle = {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginBottom: '4px',
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
    wordBreak: 'break-word',
    flexShrink: 0,
  };

  const contentStyle = {
    flexGrow: 1,
    overflowY: 'auto',
    paddingRight: '5px',
  };

  const detailStyle = {
    fontSize: '0.7rem',
    marginBottom: '2px',
    wordBreak: 'break-word',
  };

  if (!examen) {
    return null;
  }

  // Aplica setNodeRef y los listeners/attributes al div raíz del post-it
  return (
    <div ref={setNodeRef} style={postItStyle} {...props}>
      {' '}
      {/* Aplicar props de dnd-kit aquí */}
      <div style={headerStyle}>{examen.NOMBRE_ASIGNATURA}</div>
      <div style={contentStyle}>
        <div style={detailStyle}>
          <strong>Sección:</strong> {examen.NOMBRE_SECCION}
        </div>
        <div style={detailStyle}>
          <strong>Módulos:</strong> {examen.CANTIDAD_MODULOS_EXAMEN}
        </div>
      </div>
    </div>
  );
}
