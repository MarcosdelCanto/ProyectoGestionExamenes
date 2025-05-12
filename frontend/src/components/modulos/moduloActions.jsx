import React from 'react';

export default function ModuloActions({ onAdd, onEdit, onDelete, disabled }) {
  return (
    <div className="mb-3">
      <button className="btn btn-success me-2" onClick={onAdd}>
        Agregar
      </button>
      <button
        className="btn btn-warning me-2"
        onClick={onEdit}
        disabled={disabled}
      >
        Modificar
      </button>
      <button className="btn btn-danger" onClick={onDelete} disabled={disabled}>
        Eliminar
      </button>
    </div>
  );
}
