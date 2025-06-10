import React from 'react';

export default function DragFeedback({ draggedExamen, dropTargetCell }) {
  if (!draggedExamen) return null;

  const mensaje = dropTargetCell
    ? `Soltando "${draggedExamen.NOMBRE_ASIGNATURA}" en ${dropTargetCell.fecha}`
    : `Arrastrando "${draggedExamen.NOMBRE_ASIGNATURA}"`;

  return (
    <div className="drag-feedback">
      {mensaje}
      {dropTargetCell && (
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          Módulo: {dropTargetCell.modulo.ORDEN}
        </div>
      )}
    </div>
  );
}
